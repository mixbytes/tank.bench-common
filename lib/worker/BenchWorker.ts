import {isMainThread, parentPort, workerData} from "worker_threads";
import {CommitTransactionArgs, DestroyBenchArgs, TransactionResult} from "tank.bench-profile";
import {SharedData} from "./WorkerWrapper";
import {getProfileTSConfig, importProfile} from "../tools/Tools";
import {register} from "ts-node";

export function getWorkerFilePath() {
    return __filename;
}

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time));
    // Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, time);
};

const SPEEDUP_ON_PROMISES_LIMIT_EXCEED = 4.0;

enum State {
    INIT,
    PREPARING,
    PREPARED,
    BENCH,
    COMPLETED,
    ERROR
}

const sharedData = workerData as SharedData;

class BenchWorker {
    private benchRunning = false;
    private transactionsStarted = 0;
    private transactionsProcessed = 0;

    private state: State = State.INIT;

    private activePromises = 0;

    private benchError: any;

    private benchConstructResult: any;
    private commitTransaction?: ({uniqueData, threadId, benchConfig, constructData}: CommitTransactionArgs<Promise<any>, Promise<any>>) => Promise<TransactionResult>;
    private destroyBench?: ({threadId, benchConfig, constructData}: DestroyBenchArgs<Promise<any>, Promise<any>>) => Promise<any>;

    private readonly profilePath = sharedData.profilePath;

    private readonly iThreadId = sharedData.iThreadId;

    private readonly sharedTransProcessedBuffer = sharedData.sharedTransProcessedBuffer;
    private readonly sharedTransProcessedArray = new Uint32Array(this.sharedTransProcessedBuffer);

    private readonly benchConfig = sharedData.benchConfig;
    private readonly commonConfig = sharedData.commonConfig;

    private readonly targetTransactionTime = 1000.0 / this.commonConfig.tps;
    private readonly targetThreadTransactionTime = this.targetTransactionTime * this.commonConfig.threadsAmount;

    constructor() {
        parentPort!.on("message", msg => {
            switch (msg.method) {
                case "prepare":
                    this.state = State.PREPARING;
                    this.prepareToBench().then(() => {
                        this.state = State.PREPARED;
                        parentPort!.postMessage({method: "workerPrepared"});
                    }).catch(e => {
                        this.state = State.ERROR;
                        parentPort!.postMessage({method: "onError", error: e.stack ? e.stack : e.toString()});
                    });
                    return;
                case "startBenchmark":
                    this.state = State.BENCH;
                    this.startBench().then(() => {
                        this.state = State.COMPLETED;
                        parentPort!.postMessage({method: "benchFinished"});
                    }).catch(e => {
                        this.state = State.ERROR;
                        parentPort!.postMessage({method: "onError", error: e.stack ? e.stack : e.toString()});
                    });
                    return;
                default:
                    throw new Error("Unknown method");
            }
        });
        // this.activePromises = new Array(this.commonConfig.maxActivePromises).fill(0);
    }

    async prepareToBench() {
        const profile = await importProfile(this.profilePath);
        this.benchConstructResult = await profile.constructBench({
            threadId: this.iThreadId,
            benchConfig: this.benchConfig
        });
        this.commitTransaction = profile.commitTransaction;
        this.destroyBench = profile.destroyBench;
    }

    async startBench() {
        this.benchRunning = true;

        // To not start all threads in one time
        await sleep(this.targetTransactionTime * (this.iThreadId));

        await this.transactionsPushLoop();
        await this.destroyBench!({
            threadId: this.iThreadId,
            benchConfig: this.benchConfig,
            constructData: this.benchConstructResult
        });
    }

    private async commitBenchTransaction() {
        // this.activePromises[idInPromisesArray] = 1;
        this.activePromises++;

        const trStartTime = new Date().getTime();

        this.transactionsStarted++;
        let key = `${this.iThreadId}-${this.transactionsStarted}`;

        let trRes: TransactionResult;
        try {
            trRes = await this.commitTransaction!({
                uniqueData: key,
                threadId: this.iThreadId,
                benchConfig: this.benchConfig,
                constructData: this.benchConstructResult
            });
        } catch (e) {
            trRes = {code: -1, error: e};
        }


        if (trRes.error) {
            if (this.commonConfig.stopOn.error === "print")
                console.error(trRes.error.stack ? trRes.error.stack : trRes.error.toString());
            if (this.commonConfig.stopOn.error === "stop") {
                this.benchRunning = false;
                this.benchError = trRes.error;
            }
            this.activePromises--;
            return;
        }

        this.transactionsProcessed++;
        const trEndTime = new Date().getTime();
        const trDuration = trEndTime - trStartTime;

        Atomics.store(this.sharedTransProcessedArray, this.iThreadId, this.transactionsProcessed);

        parentPort!.postMessage({
            method: "onTransaction",
            id: this.iThreadId,
            respCode: trRes.code,
            trDuration
        });

        this.activePromises--;
    }


    private needToStop() {
        if (this.commonConfig.stopOn.processedTransactions > 0) {
            let processedTransactionsTotal = 0;
            for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                processedTransactionsTotal += Atomics.load(this.sharedTransProcessedArray, i);
            }
            if (processedTransactionsTotal >= this.commonConfig.stopOn.processedTransactions)
                return true;
        }
        return false;
    }

    private async transactionsPushLoop() {
        while (this.benchRunning) {
            const timeBeforeWait = new Date().getTime();

            // Wait until other promises are resolved
            while (this.activePromises == this.commonConfig.maxActivePromises) await sleep(0);

            const waitDelay = new Date().getTime() - timeBeforeWait;

            // Start promise with transaction, but don't wait for it
            // noinspection JSIgnoredPromiseFromCall
            this.commitBenchTransaction();

            if (this.targetThreadTransactionTime - waitDelay > 0)
                await sleep(this.targetThreadTransactionTime - waitDelay);

            if (this.needToStop())
                this.benchRunning = false;
        }
        if (this.benchError) {
            throw this.benchError;
        }
    }
}

if (!isMainThread) {
    parentPort!.on("message", (msg) => {
        if (msg.method === "waitForCreation") {
            process.argv = sharedData.argv;
            register({project: getProfileTSConfig()});
            new BenchWorker();
            parentPort!.postMessage({method: "workerCreated"});
        }
    });
}
