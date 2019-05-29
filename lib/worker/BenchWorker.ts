import {isMainThread, parentPort, threadId, workerData} from "worker_threads";
import Logger from "../resources/Logger";
import BenchStep from "../module/steps/BenchStep";

export default function getWorkerFilePath() {
    return __filename;
}

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const SPEEDUP_ON_PROMISES_LIMIT_EXCEED = 4.0;
const MAIN_THREAD_COMMUNICATION_DELAY = 50;
const SLEEP_COEF_LEARNING_FACTOR = 0.0024;
const SLEEP_COEF_LEARNING_MAX = 0.2;

class Bench {
    benchStep?: BenchStep;
    benchRunning = false;
    transactionsStarted = 0;
    transactionsProcessed = 0;
    benchStartTime = new Date().getTime();

    activePromises: boolean[] = [];
    benchError: any;
    sleepCoef = 1;

    readonly sharedAvgTpsBuffer = workerData.sharedAvgTpsBuffer;
    readonly sharedAvgTpsArray = new Int32Array(this.sharedAvgTpsBuffer);

    readonly sharedTransProcessedBuffer = workerData.sharedTransProcessedBuffer;
    readonly sharedTransProcessedArray = new Int32Array(this.sharedTransProcessedBuffer);

    readonly benchConfig = workerData.benchConfig;
    readonly commonConfig = workerData.commonConfig;
    readonly blockchainModuleFileName = workerData.blockchainModuleFileName;

    readonly targetTransactionTime = 1000.0 / this.commonConfig.tps;
    readonly targetThreadTransactionTime = this.targetTransactionTime * this.commonConfig.threadsAmount;

    constructor() {
        parentPort!.on("message", msg => {
            if (msg.method === "stopBenchmark") {
                this.benchRunning = false;
            } else {
                throw new Error("Unknown method");
            }
        });

        this.activePromises = new Array(this.commonConfig.maxActivePromises).fill(false);
    }

    async startBench() {
        let blockchainModule = await import(this.blockchainModuleFileName);
        this.benchStep = new blockchainModule.default()
            .createBenchStep(this.benchConfig, new Logger(this.commonConfig));

        await this.benchStep!.asyncConstruct();
        parentPort!.postMessage({method: "onStartBenchmark"});

        this.benchRunning = true;
        this.benchStartTime = new Date().getTime();

        setInterval(() => {
            Atomics.store(this.sharedAvgTpsArray, threadId - 1, this.workerAvgTps());
        }, MAIN_THREAD_COMMUNICATION_DELAY);

        // To not start all threads in one time
        await sleep(this.targetTransactionTime * (threadId - 1));
        await this.transactionsPushLoop();
    }

    private async createBenchPromise(idInPromisesArray: number) {
        this.activePromises[idInPromisesArray] = true;

        const trStartTime = new Date().getTime();

        this.transactionsStarted++;
        let key = `${threadId}-${this.transactionsStarted}`;

        let respCode = -1;
        try {
            respCode = await this.benchStep!.commitBenchmarkTransaction(key);
        } catch (e) {
            if (this.commonConfig.stopOn.error === "print")
                console.error(e ? (e.stack ? e.stack : e) : "");
            if (this.commonConfig.stopOn.error === "stop") {
                this.benchRunning = false;
                this.benchError = e;
            }
        }

        this.transactionsProcessed++;
        const trEndTime = new Date().getTime();
        const trDuration = trEndTime - trStartTime;

        Atomics.store(this.sharedTransProcessedArray, threadId - 1, this.transactionsProcessed);
        Atomics.store(this.sharedAvgTpsArray, threadId - 1, this.workerAvgTps());

        parentPort!.postMessage({
            method: "onTransaction",
            respCode,
            trDuration
        });

        this.activePromises[idInPromisesArray] = false;
    }

    private workerAvgTps() {
        return this.transactionsProcessed / (new Date().getTime() - this.benchStartTime) * 100_000_000.0;
    }

    private async tplSleep(speedUp = false) {
        let tpsDiff = this.workerAvgTps() / 100_000.0 - this.commonConfig.tps / this.commonConfig.threadsAmount;

        if (Math.abs(tpsDiff) > SLEEP_COEF_LEARNING_MAX) {
            if (tpsDiff > 0)
                tpsDiff = SLEEP_COEF_LEARNING_MAX;
            else
                tpsDiff = -SLEEP_COEF_LEARNING_MAX
        }

        this.sleepCoef += tpsDiff * SLEEP_COEF_LEARNING_FACTOR;

        let tts = this.targetThreadTransactionTime * this.sleepCoef;
        if (speedUp)
            await sleep(tts / SPEEDUP_ON_PROMISES_LIMIT_EXCEED);
        else
            await sleep(tts);
    }

    private async transactionsPushLoop() {
        while (this.benchRunning) {
            const freePromisePlace = this.activePromises.findIndex((active) => !active);
            if (freePromisePlace === -1) {
                await this.tplSleep(true);
                continue;
            }

            // noinspection JSIgnoredPromiseFromCall
            this.createBenchPromise(freePromisePlace);

            await this.tplSleep(false);
        }
        if (this.benchError) {
            throw this.benchError;
        }
    }
}

if (!isMainThread) {
    new Bench().startBench()
        .then(() => {
            parentPort!.postMessage({method: "onStopBenchmark"});
        })
        .catch(e => {
            parentPort!.postMessage({method: "onError", error: e});
        });
}
