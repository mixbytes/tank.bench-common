import {isMainThread, parentPort, workerData} from "worker_threads";
import Logger from "../resources/Logger";
import BenchProfile, {TransactionResult} from "../module/steps/BenchProfile";
import {WORKER_ERROR_DEFAULT, WORKER_STATE_ERROR, WORKER_STATE_PREPARED} from "./WorkersWrapper";
import {resolve} from "path";
import Profile from "../module/Profile";

export default function getWorkerFilePath() {
    return __filename;
}

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const SPEEDUP_ON_PROMISES_LIMIT_EXCEED = 4.0;
const MAIN_THREAD_COMMUNICATION_DELAY = 50;
// const SLEEP_COEF_LEARNING_FACTOR = 0.0024;
// const SLEEP_COEF_LEARNING_MAX = 0.2;

class Bench {
    benchProfile!: BenchProfile;
    benchRunning = false;
    transactionsStarted = 0;
    transactionsProcessed = 0;
    benchStartTime = new Date().getTime();

    activePromises: number[] = [];
    benchError: any;
    sleepCoef = 1;

    readonly profilePath = workerData.profilePath;

    readonly iThreadId = workerData.iThreadId;

    readonly sharedAvgTpsBuffer = workerData.sharedAvgTpsBuffer;
    readonly sharedAvgTpsArray = new Int32Array(this.sharedAvgTpsBuffer);

    readonly sharedTransProcessedBuffer = workerData.sharedTransProcessedBuffer;
    readonly sharedTransProcessedArray = new Int32Array(this.sharedTransProcessedBuffer);

    readonly benchConfig = workerData.benchConfig;
    readonly commonConfig = workerData.commonConfig;

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

        this.activePromises = new Array(this.commonConfig.maxActivePromises).fill(0);
    }

    async startBench() {
        let profileImport = await import(resolve(this.profilePath));
        let profile: Profile;
        if (profileImport.default) {
            profile = <Profile>profileImport.default;
        } else {
            profile = <Profile>profileImport;
        }

        this.benchProfile = new profile.benchProfile(this.benchConfig, new Logger(this.commonConfig));

        await this.benchProfile.asyncConstruct(this.iThreadId, this.benchConfig);

        Atomics.store(this.sharedTransProcessedArray, this.iThreadId, WORKER_STATE_PREPARED);

        parentPort!.postMessage({method: "onReady", id: this.iThreadId});

        // Atomics.wait(this.sharedTransProcessedArray, this.iThreadId, WORKER_STATE_START);

        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            Atomics.wait(this.sharedTransProcessedArray, this.iThreadId, WORKER_STATE_PREPARED);
        }

        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            if (Atomics.load(this.sharedTransProcessedArray, i) === WORKER_STATE_ERROR)
                return;
        }

        this.benchRunning = true;
        this.benchStartTime = new Date().getTime();

        setInterval(() => {
            Atomics.store(this.sharedAvgTpsArray, this.iThreadId, this.workerAvgTps());
        }, MAIN_THREAD_COMMUNICATION_DELAY);

        // To not start all threads in one time
        await sleep(this.targetTransactionTime * (this.iThreadId));
        await this.transactionsPushLoop();

        await this.benchProfile.asyncDestroy(this.iThreadId, this.benchConfig);
    }

    private async commitBenchTransaction(idInPromisesArray: number) {
        this.activePromises[idInPromisesArray] = 1;

        const trStartTime = new Date().getTime();

        this.transactionsStarted++;
        let key = `${this.iThreadId}-${this.transactionsStarted}`;

        let trRes: TransactionResult;
        try {
            trRes = await this.benchProfile.commitTransaction(key, this.iThreadId, this.benchConfig);
        } catch (e) {
            trRes = {code: WORKER_ERROR_DEFAULT, error: e};
        }

        if (trRes.error) {
            if (this.commonConfig.stopOn.error === "print")
                console.error(trRes.error.stack ? trRes.error.stack : trRes.error.toString());
            if (this.commonConfig.stopOn.error === "stop") {
                this.benchRunning = false;
                this.benchError = trRes.error;
            }
            Atomics.store(this.sharedAvgTpsArray, this.iThreadId, this.workerAvgTps());
            this.activePromises[idInPromisesArray] = 0;
            return;
        }

        this.transactionsProcessed++;
        const trEndTime = new Date().getTime();
        const trDuration = trEndTime - trStartTime;

        Atomics.store(this.sharedTransProcessedArray, this.iThreadId, this.transactionsProcessed);
        Atomics.store(this.sharedAvgTpsArray, this.iThreadId, this.workerAvgTps());

        parentPort!.postMessage({
            method: "onTransaction",
            id: this.iThreadId,
            respCode: trRes.code,
            trDuration
        });

        this.activePromises[idInPromisesArray] = 0;
    }

    private workerAvgTps() {
        return this.transactionsProcessed / (new Date().getTime() - this.benchStartTime) * 100_000_000.0;
    }

    private async tplSleep(speedUp = false) {
        // TODO: check if this code is suitable on real data
        // let tpsDiff = this.workerAvgTps() / 100_000.0 - this.commonConfig.tps / this.commonConfig.threadsAmount;
        //
        // if (Math.abs(tpsDiff) > SLEEP_COEF_LEARNING_MAX) {
        //     if (tpsDiff > 0)
        //         tpsDiff = SLEEP_COEF_LEARNING_MAX;
        //     else
        //         tpsDiff = -SLEEP_COEF_LEARNING_MAX
        // }
        //
        // this.sleepCoef += tpsDiff * SLEEP_COEF_LEARNING_FACTOR;

        let tts = this.targetThreadTransactionTime * this.sleepCoef;
        if (speedUp)
            await sleep(tts / SPEEDUP_ON_PROMISES_LIMIT_EXCEED);
        else
            await sleep(tts);
    }

    private async transactionsPushLoop() {
        while (this.benchRunning) {
            const freePromisePlace = this.activePromises.findIndex(active => active === 0);
            if (freePromisePlace === -1) {
                await this.tplSleep(true);
                continue;
            }

            // noinspection JSIgnoredPromiseFromCall
            this.commitBenchTransaction(freePromisePlace);

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
            parentPort!.postMessage({method: "onStopBenchmark", id: workerData.iThreadId});
        })
        .catch(e => {
            parentPort!.postMessage(
                {
                    method: "onError",
                    id: workerData.iThreadId,
                    error: e ? (e.stack ? e.stack : e.toString()) : null
                }
            );
        });
}
