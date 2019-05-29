import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import getWorkerFilePath from "./BenchWorker";
import PrometheusPusher from "../metrics/PrometheusPusher";

const FINISH_CHECKER_INTERVAL = 100;
const PROMETHEUS_UPDATE_INTERVAL = 200;
const LOGGER_INTERVAL = 500;

export default class WorkersWrapper {
    private readonly benchConfig: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly blockchainModuleFileName: string;
    private readonly workerFilePath: string;
    private readonly prometheusPusher?: PrometheusPusher;

    private lastPrometheusTrxs = 0;

    private readonly sharedAvgTpsBuffer: SharedArrayBuffer;
    private readonly sharedAvgTpsArray: Int32Array;

    private readonly sharedTransProcessedBuffer: SharedArrayBuffer;
    private readonly sharedTransProcessedArray: Int32Array;

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
                commonConfig: any,
                prometheusPusher?: PrometheusPusher) {

        this.blockchainModuleFileName = blockchainModuleFileName;
        this.benchConfig = benchConfig;
        this.logger = logger;
        this.commonConfig = commonConfig;
        this.prometheusPusher = prometheusPusher;

        this.workerFilePath = getWorkerFilePath();

        this.sharedAvgTpsBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.sharedAvgTpsArray = new Int32Array(this.sharedAvgTpsBuffer);

        this.sharedTransProcessedBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.sharedTransProcessedArray = new Int32Array(this.sharedTransProcessedBuffer);

        this.sharedTransProcessedArray.fill(0);

        this.workers = [];
    }

    async bench() {
        return new Promise((resolve, reject) => {
            this.benchResolve = resolve;
            this.benchReject = reject;
            this.startBench();
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
        console.log(`Avg tps: ${this.calcAvgTps()}`);
        console.log("");

        if (this.benchError)
            this.benchReject!(this.benchError);
        else {
            if (this.prometheusPusher)
                this.prometheusPusher.forcePush();
            this.benchResolve!();
        }
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
            case "onTransaction":
                if (this.prometheusPusher) {
                    const respCode = message.respCode;
                    const trDuration = message.trDuration;
                    this.prometheusPusher.addResponseCode(respCode);
                    this.prometheusPusher.addTrxDuration(trDuration);
                }
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
                sharedAvgTpsBuffer: this.sharedAvgTpsBuffer,
                sharedTransProcessedBuffer: this.sharedTransProcessedBuffer,
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
            processed += Atomics.load(this.sharedTransProcessedArray, i);
        }
        return processed;
    }

    private calcAvgTps(): number {
        let tps = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            tps += Atomics.load(this.sharedAvgTpsArray, i);
        }
        return tps / 100_000.0;
    }

    private startBench() {
        if (this.prometheusPusher) {
            this.prometheusPusher.start();
            setInterval(() => {
                const processed = this.calcProcessed();
                this.prometheusPusher!.addProcessedTransactions(processed - this.lastPrometheusTrxs);

                this.prometheusPusher!.setAvgTps(this.calcAvgTps());
                this.lastPrometheusTrxs = processed;

            }, PROMETHEUS_UPDATE_INTERVAL);
        }

        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            this.addWorker();
            this.activeWorkers++;
        }

        this.stopIfProcessedInterval = setInterval(() => {
            if (this.calcProcessed() >= this.commonConfig.stopOn.processedTransactions) {
                clearInterval(this.stopIfProcessedInterval);
                this.stopBench();
            }
        }, FINISH_CHECKER_INTERVAL);

        this.logInterval = setInterval(() => {
            console.log(`processed: ${this.calcProcessed()}`);
            console.log(`avg tps: ${this.calcAvgTps()}`);
            console.log("");
        }, LOGGER_INTERVAL);
    }
}
