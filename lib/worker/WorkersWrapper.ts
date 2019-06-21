import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import getWorkerFilePath from "./BenchWorker";
import PrometheusPusher from "../metrics/PrometheusPusher";
import BlockchainModule from "../module/BlockchainModule";
import BenchTelemetryStep, {TelemetryData} from "../module/steps/BenchTelemetryStep";

const FINISH_CHECKER_INTERVAL = 100;
const PROMETHEUS_UPDATE_INTERVAL = 200;
const LOGGER_INTERVAL = 500;
const LAST_TRXS_AMOUNT_FOR_LOCAL_TPS = 20;

export const WORKER_STATE_PREPARING = -2;
export const WORKER_STATE_PREPARED = -1;
export const WORKER_STATE_START = 0;

export default class WorkersWrapper {
    private readonly benchConfig: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly blockchainModule: BlockchainModule;
    private readonly workerFilePath: string;
    private readonly prometheusPusher?: PrometheusPusher;

    private lastPrometheusTrxs = 0;
    private processedTransactions = 0;
    private benchStartTime = 0;
    private readonly trxsEndTimes: number[];

    private readonly sharedAvgTpsBuffer: SharedArrayBuffer;
    private readonly sharedAvgTpsArray: Int32Array;

    private readonly sharedTransProcessedBuffer: SharedArrayBuffer;
    private readonly sharedTransProcessedArray: Int32Array;

    private readonly workers: Worker[];
    private readonly terminatedWorkers = new Map<Worker, boolean>();

    private readonly benchTelemetryStep: BenchTelemetryStep;

    private logInterval: any;
    private stopIfProcessedInterval: any;
    private prometheusInterval: any;
    private telemetryStepInterval: any;

    private benchError: any = null;

    private activeWorkers = 0;
    private benchResolve?: (value?: (PromiseLike<Promise<Promise<any>>> | Promise<Promise<any>>)) => void;
    private benchReject?: (reason?: any) => void;

    constructor(blockchainModule: BlockchainModule,
                benchTelemetryStep: BenchTelemetryStep,
                logger: Logger,
                benchConfig: any,
                commonConfig: any,
                prometheusPusher?: PrometheusPusher) {

        this.blockchainModule = blockchainModule;
        this.benchTelemetryStep = benchTelemetryStep;
        this.benchConfig = benchConfig;
        this.logger = logger;
        this.commonConfig = commonConfig;
        this.prometheusPusher = prometheusPusher;

        this.workerFilePath = getWorkerFilePath();

        this.sharedAvgTpsBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.sharedAvgTpsArray = new Int32Array(this.sharedAvgTpsBuffer);

        this.sharedTransProcessedBuffer = new SharedArrayBuffer(4 * this.commonConfig.threadsAmount);
        this.sharedTransProcessedArray = new Int32Array(this.sharedTransProcessedBuffer);

        this.sharedTransProcessedArray.fill(WORKER_STATE_PREPARING);

        this.workers = [];

        this.trxsEndTimes = new Array(LAST_TRXS_AMOUNT_FOR_LOCAL_TPS).fill(0);
    }

    async bench() {
        return new Promise((resolve, reject) => {
            this.benchResolve = resolve;
            this.benchReject = reject;
            this.activeWorkers = this.commonConfig.threadsAmount;
            for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                this.addWorker();
            }
        })
    }

    private onWorkerTerminate() {
        this.activeWorkers--;
        if (this.activeWorkers !== 0)
            return;

        if (this.logInterval)
            clearInterval(this.logInterval);
        if (this.prometheusInterval)
            clearInterval(this.prometheusInterval);
        if (this.telemetryStepInterval)
            clearInterval(this.telemetryStepInterval);

        this.benchTelemetryStep.onBenchEnded(this.calcTelemetryStepData()).then(() => {
            if (this.benchError)
                console.log("Benchmark finished with error");
            else
                console.log("Benchmark finished successfully");

            console.log(`Total processed: ${this.processedTransactions}`);
            console.log(`Local tps: ${this.calcLocalTps()}`);
            console.log(`Avg   tps: ${this.calcAvgTps()}`);
            console.log("");

            if (this.benchError)
                this.benchReject!(this.benchError);
            else {
                if (this.prometheusPusher)
                    this.prometheusPusher.forcePush();
                this.benchResolve!();
            }
        }).catch(e => {
            this.benchReject!(e);
        });
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
                if (this.stopIfProcessedInterval)
                    clearInterval(this.stopIfProcessedInterval);
                worker.terminate(() => {
                    this.onWorkerTerminate();
                });
                this.terminatedWorkers.set(worker, true);
                this.stopBench();
                break;
            case "onTransaction":
                this.trxsEndTimes.shift();
                this.trxsEndTimes[LAST_TRXS_AMOUNT_FOR_LOCAL_TPS - 1] = new Date().getTime();

                this.processedTransactions++;

                if (this.prometheusPusher) {
                    const respCode = message.respCode;
                    const trDuration = message.trDuration;
                    this.prometheusPusher.addResponseCode(respCode);
                    this.prometheusPusher.addTrxDuration(trDuration);
                }
                break;
            case "onReady":
                for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                    if (Atomics.load(this.sharedTransProcessedArray, i) != WORKER_STATE_PREPARED)
                        return;
                }
                for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                    Atomics.store(this.sharedTransProcessedArray, i, WORKER_STATE_START)
                }
                this.startBench();
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
                blockchainModuleFileName: this.blockchainModule.getFileName()
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

    private calcAvgTps(): number {
        let tps = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            tps += Atomics.load(this.sharedAvgTpsArray, i);
        }
        return tps / 100_000.0;
    }

    private calcLocalTps(): number {
        return Math.min(LAST_TRXS_AMOUNT_FOR_LOCAL_TPS, this.processedTransactions)
            / (new Date().getTime() - this.trxsEndTimes[0]) * 1000;
    }

    private calcTelemetryStepData(): TelemetryData {
        return {
            avgTps: this.calcAvgTps(),
            lastLocalTps: this.calcLocalTps(),
            processedTransactions: this.processedTransactions,
            benchTime: new Date().getTime() - this.benchStartTime,
            processedTransactionsPerThread: Array.from(this.sharedTransProcessedArray)
        };
    }

    private startBench() {

        this.benchStartTime = new Date().getTime();

        if (this.prometheusPusher) {
            this.prometheusPusher.start();
            this.prometheusInterval = setInterval(() => {
                const processed = this.processedTransactions;
                this.prometheusPusher!.addProcessedTransactions(processed - this.lastPrometheusTrxs);

                this.prometheusPusher!.setAvgTps(this.calcAvgTps());
                this.lastPrometheusTrxs = processed;

            }, PROMETHEUS_UPDATE_INTERVAL);
        }

        this.telemetryStepInterval = setInterval(() => {
            this.benchTelemetryStep.onKeyPoint(this.calcTelemetryStepData());
        }, this.commonConfig.telemetryStepInterval);

        this.stopIfProcessedInterval = setInterval(() => {
            if (this.commonConfig.stopOn.processedTransactions > 0) {
                if (this.processedTransactions >= this.commonConfig.stopOn.processedTransactions) {
                    clearInterval(this.stopIfProcessedInterval);
                    this.stopBench();
                }
            }
        }, FINISH_CHECKER_INTERVAL);

        this.logInterval = setInterval(() => {
            console.log(`processed: ${this.processedTransactions}`);
            console.log(`local tps: ${this.calcLocalTps()}`);
            console.log(`avg   tps: ${this.calcAvgTps()}`);
            console.log("");
        }, LOGGER_INTERVAL);
    }
}
