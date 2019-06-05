import Strings from "../resources/Strings";
import BlockchainModule from "../module/BlockchainModule";
import Logger from "../resources/Logger";
import WorkersWrapper from "../worker/WorkersWrapper";
import Config from "../config/Config";
import PrometheusPusher from "../metrics/PrometheusPusher";

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

    async bench() {
        let prometheusPusher = undefined;

        // Prepare prometheus
        if (this.commonConfig.prometheusTelemetry.enable) {
            this.logger.log(Strings.log.preparingTelemetry());
            prometheusPusher = new PrometheusPusher(this.commonConfig);
            await prometheusPusher.test();
            this.logger.log(Strings.log.preparingTelemetrySuccess());
        }

        // Process prepare step
        let prepareStep = this.blockchainModule
            .createPrepareStep(this.commonConfig, this.moduleConfig, this.logger);
        await prepareStep.asyncConstruct();
        let benchConfig = await prepareStep.prepare();

        // Process benchData step
        let benchTelemetryStep = this.blockchainModule
            .createBenchTelemetryStep(benchConfig, this.logger);
        await benchTelemetryStep.asyncConstruct();

        // Log the start of blockchain
        this.logger.log(Strings.log.startingBenchmark(this.commonConfig.threadsAmount));

        await new WorkersWrapper(
            this.blockchainModule,
            benchTelemetryStep,
            this.logger,
            benchConfig,
            this.commonConfig,
            prometheusPusher,
        ).bench();
    }
}
