import {isMainThread, parentPort, threadId, workerData} from "worker_threads";
import Logger from "../resources/Logger";
import BenchStep from "../module/steps/BenchStep";

export default function getWorkerFilePath() {
    return __filename;
}

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const TPS_DELAY = 100.0;
const LOCAL_TPS_DELAY = 50.0;
const LOCAL_TPS_MEASURES = 40.0;

class Bench {
    benchStep?: BenchStep;
    benchRunning = false;
    transactionsStarted = 0;
    transactionsProcessed = 0;
    benchStartTime = new Date().getTime();

    localTpsAlreadyMesured = 0;
    localTpsTransProcessedLast = 0;
    localTpsTransProcessed: number[] = [];

    readonly tpsBuffer = workerData.tpsSharedBuffer;
    readonly tpsArray = new Int32Array(this.tpsBuffer);

    readonly localTpsBuffer = workerData.localTpsSharedBuffer;
    readonly localTpsArray = new Int32Array(this.localTpsBuffer);

    readonly transProcessedBuffer = workerData.transProcessedSharedBuffer;
    readonly transProcessedArray = new Int32Array(this.transProcessedBuffer);

    readonly benchConfig = workerData.benchConfig;
    readonly commonConfig = workerData.commonConfig;
    readonly blockchainModuleFileName = workerData.blockchainModuleFileName;

    constructor() {
        parentPort!.on("message", msg => {
            if (msg.method === "stopBenchmark") {
                this.stopBench();
            } else {
                throw new Error("Unknown method");
            }
        });
        setInterval(() => {
            Atomics.store(this.tpsArray, threadId - 1, Math.trunc(this.tps()))
        }, TPS_DELAY);

        setInterval(() => {
            this.localTpsTransProcessed.shift();
            this.localTpsTransProcessed[LOCAL_TPS_MEASURES - 1] = this.localTpsTransProcessedLast;
            this.localTpsTransProcessedLast = 0;
            this.localTpsAlreadyMesured++;
            Atomics.store(this.localTpsArray, threadId - 1, Math.trunc(this.localTps()));
        }, LOCAL_TPS_DELAY);
    }

    async startBench() {
        let blockchainModule = await import(this.blockchainModuleFileName);
        this.benchStep = new blockchainModule.default()
            .createBenchStep(this.benchConfig, new Logger(this.commonConfig));

        await this.benchStep!.asyncConstruct();
        parentPort!.postMessage({method: "onStartBenchmark"});

        await this.bench();
    }

    private createBenchPromise() {
        return new Promise(async resolve => {
            while (this.benchRunning) {
                this.transactionsStarted++;
                let key = `${threadId}-${this.transactionsStarted}`;
                try {
                    await this.benchStep!.commitBenchmarkTransaction(key);
                } catch (e) {
                    if (this.commonConfig.stopOn.error === "print")
                        console.error(e ? (e.stack ? e.stack : e) : "");
                    if (this.commonConfig.stopOn.error === "stop")
                        throw e;
                }
                this.transactionsProcessed++;
                this.localTpsTransProcessedLast++;
                Atomics.add(this.transProcessedArray, threadId - 1, 1);

                let tps = this.globalTps();

                let tts =
                    tps * this.commonConfig.maxActivePromises * 4 +
                    tps * this.commonConfig.threadsAmount * 2;

                tts *= 3;
                tts += (20 - this.commonConfig.tps) * 180;

                // console.log(tts);
                await sleep(tts);
            }

            resolve();
        });
    }

    private tps() {
        return 1000000.0 * this.transactionsProcessed / (new Date().getTime() - this.benchStartTime);
    }

    private localTps() {
        let measures = Math.min(this.localTpsAlreadyMesured, LOCAL_TPS_MEASURES);
        return 1000000.0 * this.localTpsTransProcessed.reduce((a, v) => a + v, 0) / LOCAL_TPS_DELAY / measures;
    }

    private globalTps() {
        let tps = 0;
        for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
            tps += Atomics.load(this.localTpsArray, i);
        }
        return tps / 1000.0;
    }

    private async bench() {
        this.benchRunning = true;
        this.benchStartTime = new Date().getTime();

        let promises = [];
        for (let i = 0; i < this.commonConfig.maxActivePromises; i++) {
            promises.push(this.createBenchPromise());
            await sleep(this.commonConfig.promisesStartDelay);
        }
        await Promise.all(promises);
    }

    private stopBench() {
        this.benchRunning = false;
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
