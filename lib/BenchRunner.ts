import Strings from "./resources/Strings";
import convictConfig from "./config/convictConfig";
import BlockchainModule from "./module/BlockchainModule";
import Logger from "./resources/Logger";
import WorkerWrapper from "./worker/WorkerWrapper";

export default class BenchRunner {
    private readonly blockchainModule: BlockchainModule;
    private readonly commonConfig: any;
    private readonly logger: Logger;

    constructor(blockchainModule: BlockchainModule) {
        this.blockchainModule = blockchainModule;
        try {
            convictConfig.loadFile(convictConfig.getProperties().configFile);
            convictConfig.validate({allowed: 'strict'});
        } catch (e) {
            console.error(Strings.error.commonErrorMsg(
                `${Strings.error.invalidConfigFile()}\n\n${e}`
            ));
        }
        this.commonConfig = convictConfig.getProperties();
        this.logger = new Logger(this.commonConfig);
    }

    // private

    bench(): Promise<any> {
        this.logger.log(Strings.log.preparingToBenchmark());
        let prepareStep = this.blockchainModule.createPrepareStep(this.commonConfig, this.logger);
        return prepareStep.asyncConstruct()
            .then(() => prepareStep.prepare())
            .then(config => this.runBench(config))
            .catch(e => {
                this.logger.error(Strings.error.commonErrorMsg(e.stack ? e.stack : e))
            });
    }

    private runBench(config: any): Promise<any> {
        this.logger.log(Strings.log.startingBenchmark(this.commonConfig.threadsAmount));
        let workers: WorkerWrapper[] = [];
        let resolved = false;
        return new Promise<any>(resolve => {
            let proceededTransfers = 0;

            // HACK TO CONSOLE
            // Here not to exceed stdout event listeners
            Object.defineProperty(console, '_ignoreErrors', {value: false});

            const onKeyPoint = () => {
                proceededTransfers += 10;
                this.logger.log(Strings.log.proceededNTransactions(proceededTransfers));
                if (this.commonConfig.stopOn.processedTransactions !== -1 && proceededTransfers >= this.commonConfig.stopOn.processedTransactions) {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }
            };

            const onError = (e: any) => {
                if (!resolved) {
                    resolved = true;
                    resolve(e);
                }
            };

            for (let i = 0; i < this.commonConfig.threadsAmount; i++) {
                workers.push(new WorkerWrapper(
                    this.blockchainModule.getFileName(),
                    this.logger,
                    config,
                    this.commonConfig,
                    onKeyPoint,
                    onError
                ));
            }
        }).then(async e => {
            await Promise.all(workers.map(w => {
                    return w.stopBenchmark();
                }
            ));
            if (e) {
                throw e;
            } else {
                this.logger.log(Strings.log.benchmarkFinished());
            }
        });
    }
}
