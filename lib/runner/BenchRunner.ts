import Strings from "../resources/Strings";
import BlockchainModule from "../module/BlockchainModule";
import Logger from "../resources/Logger";
import WorkerWrapper from "../worker/WorkerWrapper";
import Config from "../config/Config";

export default class BenchRunner {
    private readonly blockchainModule: BlockchainModule;
    private readonly config: Config;
    private readonly commonConfig: any;
    private readonly moduleConfig: any;
    private readonly logger: Logger;

    constructor(blockchainModule: BlockchainModule) {
        this.blockchainModule = blockchainModule;
        this.config = new Config(blockchainModule);
        this.commonConfig = this.config.getCommonConfig();
        this.moduleConfig = this.config.getModuleConfig();
        this.logger = new Logger(this.commonConfig);
    }

    // noinspection JSUnusedGlobalSymbols
    bench(): Promise<any> {
        this.logger.log(Strings.log.preparingToBenchmark());

        let prepareStep = this.blockchainModule
            .createPrepareStep(this.commonConfig, this.moduleConfig, this.logger);

        return prepareStep.asyncConstruct()
            .then(() => prepareStep.prepare())
            .then(benchConfig => this.runBench(benchConfig))
            .catch(e => {
                throw e;
            });
    }

    private runBench(benchConfig: any): Promise<any> {
        this.logger.log(Strings.log.startingBenchmark(this.commonConfig.threadsAmount));
        let workers: WorkerWrapper[] = [];
        let resolved = false;
        return new Promise<any>(resolve => {
            let proceededTransfers = 0;

            // HACK TO CONSOLE
            // Here not to exceed stdout event listeners
            Object.defineProperty(console, '_ignoreErrors', {value: false});

            const onCommittedTransaction = () => {
                proceededTransfers++;

                if (proceededTransfers % this.commonConfig.log.keyPoints == 0)
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
                    benchConfig,
                    this.commonConfig,
                    onCommittedTransaction,
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
