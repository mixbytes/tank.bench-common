import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import getWorkerFilePath from "./BenchWorker";

export default class WorkersWrapper {
    private readonly benchConfig: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly blockchainModuleFileName: string;
    private readonly workerFilePath: string;

    private readonly tpsBuffer: SharedArrayBuffer;
    private readonly tpsArray: Int32Array;

    private readonly localTpsBuffer: SharedArrayBuffer;
    private readonly localTpsArray: Int32Array;

    private readonly transProcessedBuffer: SharedArrayBuffer;
    private readonly transProcessedArray: Int32Array;

    private readonly workers: Worker[];
    private readonly terminatedWorkers = new Map<Worker, boolean>();

    private logInterval: any;
    private stopIfProcessedInterval: any;

    private benchError: any = null;

    private activeWorkers = 0;
    private benchResolve?: (value?: (PromiseLike<Promise<Promise<any>>> | Promise<Promise<any>>)) => void;
    private benchReject?: (reason?: any) => void;

    constructor(blockchainModuleFileName: string,
                logger: Logger,
                benchConfig: any,
                commonConfig: any) {

        this.blockchainModuleFileName = blockchainModuleFileName;
        this.benchConfig = benchConfig;
        this.logger = logger;
        this.commonConfig = commonConfig;

        this.workerFilePath = getWorkerFilePath();

        this.tpsBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.tpsArray = new Int32Array(this.tpsBuffer);

        this.localTpsBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.localTpsArray = new Int32Array(this.localTpsBuffer);

        this.transProcessedBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.transProcessedArray = new Int32Array(this.transProcessedBuffer);

        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            this.transProcessedArray[i] = 0;
        }

        this.workers = [];
    }

    async bench() {
        return new Promise((resolve, reject) => {
            this.benchResolve = resolve;
            this.benchReject = reject;
            this.prepare();
        })
    }

    private onWorkerTerminate() {
        this.activeWorkers--;
        if (this.activeWorkers !== 0)
            return;

        clearInterval(this.logInterval);

        if (this.benchError)
            console.log("Benchmark finished with error");
        else
            console.log("Benchmark finished successfully");

        console.log(`Total processed: ${this.calcProcessed()}`);
        console.log(`Avg tps: ${this.calcTps()}`);
        console.log("");

        if (this.benchError)
            this.benchReject!(this.benchError);
        else
            this.benchResolve!();
    }

    private onMessage(worker: Worker, message: any) {
        switch (message.method) {
            case "onStopBenchmark":
                worker.terminate(() => {
                    this.onWorkerTerminate();
                });
                this.terminatedWorkers.set(worker, true);
                break;
            case "onError":
                this.benchError = message.error;
                clearInterval(this.stopIfProcessedInterval);
                worker.terminate(() => {
                    this.onWorkerTerminate();
                });
                this.terminatedWorkers.set(worker, true);
                this.stopBench();
                break;
            case "onStartBenchmark":
                break;
            default:
                throw new Error("Unknown method");
        }
    }

    private addWorker() {
        let worker = new Worker(this.workerFilePath, {
            workerData: {
                benchConfig: this.benchConfig,
                commonConfig: this.commonConfig,
                tpsSharedBuffer: this.tpsBuffer,
                localTpsSharedBuffer: this.localTpsBuffer,
                transProcessedSharedBuffer: this.transProcessedBuffer,
                blockchainModuleFileName: this.blockchainModuleFileName
            }
        });

        worker.on('message', (msg) => {
            this.onMessage(worker, msg);
        });

        this.workers.push(worker);
        this.terminatedWorkers.set(worker, false);
    }

    private stopBench() {
        this.workers.forEach(worker => {
            if (!this.terminatedWorkers.get(worker)) {
                worker.postMessage({method: "stopBenchmark"});
            }
        });
    }

    private calcProcessed(): number {
        let processed = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            processed += Atomics.load(this.transProcessedArray, i);
        }
        return processed;
    }

    private calcTps(): number {
        let tps = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            tps += Atomics.load(this.tpsArray, i);
        }
        return tps / 1000.0;
    }

    private calcLocalTps(): number {
        let tps = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            tps += Atomics.load(this.localTpsArray, i);
        }
        return tps / 1000.0;
    }

    private prepare() {
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            this.addWorker();
            this.activeWorkers++;
        }
        this.stopIfProcessedInterval = setInterval(() => {
            if (this.calcProcessed() >= this.commonConfig.stopOn.processedTransactions) {
                clearInterval(this.stopIfProcessedInterval);
                this.stopBench();
            }
        }, 100);
        this.logInterval = setInterval(() => {
            console.log(`processed: ${this.calcProcessed()}`);
            console.log(`local tps: ${this.calcLocalTps()}`);
            console.log(`avg tps: ${this.calcTps()}`);
            console.log("");
        }, 500);
    }
}
