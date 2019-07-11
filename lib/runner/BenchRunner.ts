import Strings from "../resources/Strings";
import BlockchainModule from "../module/BlockchainModule";
import Logger from "../resources/Logger";
import WorkersWrapper from "../worker/WorkersWrapper";
import Config from "../config/Config";
import PrometheusPusher from "../metrics/PrometheusPusher";

export default class BenchRunner {
    private readonly blockchainModule: BlockchainModule;
    private readonly config!: Config;
    private commonConfig!: any;
    private moduleConfig!: any;
    private logger!: Logger;

    constructor(blockchainModule: BlockchainModule) {
        this.blockchainModule = blockchainModule;
        this.config = new Config();
    }

    async bench(exit = true) {
        let prometheusPusher = undefined;

        await this.config.init(this.blockchainModule);
        this.commonConfig = this.config.getCommonConfig();
        this.moduleConfig = this.config.getModuleConfig();

        this.logger = new Logger(this.commonConfig);

        // Prepare prometheus
        if (this.commonConfig.prometheusTelemetry.enable) {
            this.logger.log(Strings.log.preparingTelemetry());
            prometheusPusher = new PrometheusPusher(this.commonConfig);
            await prometheusPusher.test();
            this.logger.log(Strings.log.preparingTelemetrySuccess());
        }

        let preparation = new this.config.profile.preparationProfile!(this.commonConfig, this.moduleConfig, this.logger);
        await preparation.asyncConstruct(this.commonConfig, this.moduleConfig);
        let benchConfig = await preparation.prepare(this.commonConfig, this.moduleConfig);

        let telemetry = new this.config.profile.telemetryProfile!(benchConfig, this.logger);
        await telemetry.asyncConstruct(benchConfig);

        await new WorkersWrapper(
            this.config.profile.fileName,
            telemetry,
            this.logger,
            benchConfig,
            this.commonConfig,
            prometheusPusher,
        ).bench();

        if (exit) {
            process.exit(0)
        }
    }
}
