import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import Strings from "../resources/Strings";

export default class WorkerWrapper {
    private readonly benchConfig: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly worker: Worker;

    private readonly onCommittedTransaction: () => any;
    private readonly onError: (e: Error) => any;

    private stopCallback?: (...args: any) => any;

    constructor(blockchainModuleFileName: string,
                logger: Logger,
                benchConfig: any,
                commonConfig: any,
                onCommittedTransaction: () => any,
                onError: (e: Error) => any) {
        this.benchConfig = benchConfig;
        this.logger = logger;
        this.onError = onError;
        this.onCommittedTransaction = onCommittedTransaction;
        this.commonConfig = commonConfig;

        this.worker = new Worker(Strings.constants.workerFilePath(), {
            workerData: {
                benchConfig: this.benchConfig,
                commonConfig: this.commonConfig,
                filename: blockchainModuleFileName
            }
        });

        this.worker.on('message', (msg) => {
            if (msg.method) {
                switch (msg.method) {
                    case "onCommitted":
                        this.onCommittedTransaction();
                        break;
                    case "onError":
                        this.onError(msg.error);
                        break;
                    case "stopBenchmark":
                        this.worker.terminate(() => {
                            if (this.stopCallback)
                                this.stopCallback();
                        });
                        break;
                }
            }
        });
    }

    stopBenchmark(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.stopCallback) {
                reject(new Error("Bench is already stopping"));
                return;
            }
            this.worker.postMessage({method: "stopBenchmark"});
            this.stopCallback = resolve;
        });
    }
}
