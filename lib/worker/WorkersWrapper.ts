import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import getWorkerFilePath from "./BenchWorker";
import PrometheusPusher from "../metrics/PrometheusPusher";
import TelemetryProfile, {TelemetryData} from "../module/steps/TelemetryProfile";
import Strings from "../resources/Strings";

const FINISH_CHECKER_INTERVAL = 100;
const PROMETHEUS_UPDATE_INTERVAL = 200;
const LOGGER_INTERVAL = 500;
const LAST_TRXS_AMOUNT_FOR_LOCAL_TPS = 20;

export const WORKER_STATE_PREPARING = -2;
export const WORKER_STATE_PREPARED = -1;
export const WORKER_STATE_ERROR = -3;
export const WORKER_STATE_START = 0;

export const WORKER_ERROR_DEFAULT = -1;
export const WORKER_ERROR_NO_IMPLEMENTATION = -2;

export default class WorkersWrapper {
    private readonly benchConfig: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly workerFilePath: string;
    private readonly prometheusPusher?: PrometheusPusher;
    private readonly profilePath: string;

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

    private readonly telemetryProfile: TelemetryProfile;

    private logInterval: any;
    private stopIfProcessedInterval: any;
    private prometheusInterval: any;
    private telemetryStepInterval: any;

    private benchError: any = null;
    private wasStarted = false;

    private activeWorkers = 0;
    private benchResolve?: (value?: (PromiseLike<Promise<Promise<any>>> | Promise<Promise<any>>)) => void;
    private benchReject?: (reason?: any) => void;

    constructor(profilePath: string,
                telemetryProfile: TelemetryProfile,
                logger: Logger,
                benchConfig: any,
                commonConfig: any,
                prometheusPusher?: PrometheusPusher) {

        this.profilePath = profilePath;
        this.telemetryProfile = telemetryProfile;
        this.benchConfig = benchConfig;
        this.logger = logger;
        this.commonConfig = commonConfig;
        this.prometheusPusher = prometheusPusher;

        this.workerFilePath = getWorkerFilePath();

        this.sharedAvgTpsBuffer =
            new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * this.commonConfig.threadsAmount);
        this.sharedAvgTpsArray = new Int32Array(this.sharedAvgTpsBuffer);

        this.sharedTransProcessedBuffer =
            new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * this.commonConfig.threadsAmount);
        this.sharedTransProcessedArray = new Int32Array(this.sharedTransProcessedBuffer);

        this.sharedTransProcessedArray.fill(WORKER_STATE_PREPARING);

        this.workers = [];

        this.trxsEndTimes = new Array(LAST_TRXS_AMOUNT_FOR_LOCAL_TPS).fill(0);
    }

    async bench() {
        return new Promise((resolve, reject) => {
            this.logger.log(Strings.log.startingBenchmarkThreads());
            this.benchResolve = resolve;
            this.benchReject = reject;
            this.activeWorkers = this.commonConfig.threadsAmount;
            for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                this.addWorker(i);
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

        this.telemetryProfile.onBenchEnded(this.calcTelemetryStepData()).then(() => {
            if (this.wasStarted) {
                if (this.benchError)
                    console.log("Benchmark finished with error");
                else
                    console.log("Benchmark finished successfully");

                console.log(`Total processed: ${this.processedTransactions}`);
                console.log(`Local tps: ${this.calcLocalTps()}`);
                console.log(`Avg   tps: ${this.calcAvgTps()}`);
                console.log("");
            } else {
                console.log("Could not start benchmark");
            }

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
                worker.terminate().then(() => {
                    this.onWorkerTerminate();
                });
                this.terminatedWorkers.set(worker, true);
                break;
            case "onError":
                this.benchError = message.error;
                if (this.stopIfProcessedInterval)
                    clearInterval(this.stopIfProcessedInterval);

                worker.terminate().then(() => {
                    this.onWorkerTerminate();
                });
                this.terminatedWorkers.set(worker, true);

                if (!this.wasStarted) {
                    Atomics.store(this.sharedTransProcessedArray, message.id, WORKER_STATE_ERROR);
                    for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                        if (Atomics.load(this.sharedTransProcessedArray, i) == WORKER_STATE_PREPARING)
                            return;
                    }
                    for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                        if (Atomics.load(this.sharedTransProcessedArray, i) == WORKER_STATE_PREPARED)
                            Atomics.store(this.sharedTransProcessedArray, i, WORKER_STATE_START);
                        Atomics.notify(this.sharedTransProcessedArray, i, this.commonConfig.threadsAmount);
                    }
                    return;
                }
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
                    if (Atomics.load(this.sharedTransProcessedArray, i) == WORKER_STATE_PREPARING)
                        return;
                }
                for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                    if (Atomics.load(this.sharedTransProcessedArray, i) == WORKER_STATE_PREPARED)
                        Atomics.store(this.sharedTransProcessedArray, i, WORKER_STATE_START);
                    Atomics.notify(this.sharedTransProcessedArray, i, this.commonConfig.threadsAmount);
                }
                this.startBench();
                break;
            default:
                throw new Error("Unknown method");
        }
    }

    private addWorker(iThreadId: number) {
        let worker = new Worker(this.workerFilePath, {
            workerData: {
                benchConfig: this.benchConfig,
                commonConfig: this.commonConfig,
                sharedAvgTpsBuffer: this.sharedAvgTpsBuffer,
                sharedTransProcessedBuffer: this.sharedTransProcessedBuffer,
                profilePath: this.profilePath,
                iThreadId: iThreadId
            }
        });

        worker.on('message', (msg) => {
            this.onMessage(worker, msg);
        });

        this.workers.push(worker);
        this.terminatedWorkers.set(worker, false);
    }

    private stopBench() {
        // for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
        //     Atomics.notify(this.sharedTransProcessedArray, i, this.commonConfig.threadsAmount);
        // }
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

        // Log the start of blockchain
        this.logger.log(Strings.log.startingBenchmark(this.commonConfig.threadsAmount));

        this.wasStarted = true;

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
            this.telemetryProfile.onKeyPoint(this.calcTelemetryStepData());
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
