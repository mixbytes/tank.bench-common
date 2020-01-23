import {Worker} from "worker_threads";
import {getWorkerFilePath} from "./BenchWorker";
import {CommonConfig} from "../config/CommonConfigSchema";


export type SharedData = {
    iThreadId: number,
    profilePath: string,
    sharedTransProcessedBuffer: SharedArrayBuffer,
    commonConfig: CommonConfig,
    benchConfig: any
}

export class WorkerWrapper {
    private readonly worker: Worker;

    constructor(worker: Worker) {
        this.worker = worker;
    }

    public static async create(
        threadId: number,
        profileFilePath: string,
        sharedTransProcessedBuffer: SharedArrayBuffer,
        commonConfig: CommonConfig,
        benchConfig: any,
    ): Promise<WorkerWrapper> {
        const sharedData: SharedData = {
            sharedTransProcessedBuffer,
            profilePath: profileFilePath,
            iThreadId: threadId,
            commonConfig,
            benchConfig
        };
        const worker = new Worker(getWorkerFilePath(), {
            workerData: sharedData
        });
        const wrapper = new WorkerWrapper(worker);
        try {
            await wrapper.call("waitForCreation", "workerCreated");
            return wrapper;
        } catch (e) {
            await wrapper.terminate();
            throw e;
        }
    }

    public terminate() {
        return this.worker.terminate();
    }

    public bench(onTransaction: (threadId: number, respCode: number, trDuration: number) => any) {
        this.worker.on("message", msg => {
            if (msg.method === "onTransaction") {
                const threadId = msg.id;
                const respCode = msg.respCode;
                const trDuration = msg.trDuration;
                onTransaction(threadId, respCode, trDuration);
            }
        });
        return this.call("startBenchmark", "benchFinished");
    }

    public prepare() {
        return this.call("prepare", "workerPrepared");
    }

    private call(method: string, expectedMethod: string) {
        return new Promise((resolve, reject) => {
            this.worker.on("message", msg => {
                if (msg.method === expectedMethod) {
                    resolve();
                } else if (msg.error)
                    reject(msg.error);
            });
            this.worker.postMessage({method});
        });
    }
}
