import {Worker} from "worker_threads";
import Logger from "../resources/Logger";
import Strings from "../resources/Strings";

export default class WorkerWrapper {
    private readonly config: any;
    private readonly commonConfig: any;
    private readonly logger: Logger;
    private readonly worker: Worker;

    private readonly onKeyPoint: () => any;
    private readonly onError: (e: Error) => any;

    private stopCallback?: (...args: any) => any;

    constructor(blockchainModuleFileName: string,
                logger: Logger,
                config: any,
                commonConfig: any,
                onKeyPoint: () => any,
                onError: (e: Error) => any) {
        this.config = config;
        this.logger = logger;
        this.onError = onError;
        this.onKeyPoint = onKeyPoint;
        this.commonConfig = commonConfig;

        this.worker = new Worker(Strings.constants.workerFilePath(), {
            workerData: {
                config: this.config,
                commonConfig: this.commonConfig,
                filename: blockchainModuleFileName
            }
        });

        this.worker.on('message', (msg) => {
            if (msg.method) {
                switch (msg.method) {
                    case "onKeyPoint":
                        this.onKeyPoint();
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
