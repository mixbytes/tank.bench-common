import Strings from "../resources/Strings";
import BlockchainModule from "../module/BlockchainModule";
import Logger from "../resources/Logger";
import WorkersWrapper from "../worker/WorkersWrapper";
import Config from "../config/Config";
import PrometheusPusher from "../metrics/PrometheusPusher";
import {PreparationProfile, TelemetryProfile} from "../index";

class BenchRunner {
    private readonly blockchainModule: BlockchainModule;
    private readonly config!: Config;
    private commonConfig!: any;
    private moduleConfig!: any;
    private logger!: Logger;

    constructor(blockchainModule: BlockchainModule, config: Config) {
        this.blockchainModule = blockchainModule;
        this.config = config;
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

        let preparationProfile = this.config.profile.preparationProfile as typeof PreparationProfile;
        let preparation = new preparationProfile(this.commonConfig, this.moduleConfig, this.logger);
        await preparation.asyncConstruct(this.commonConfig, this.moduleConfig);
        let benchConfig = await preparation.prepare(this.commonConfig, this.moduleConfig);


        let telemetryProfile = this.config.profile.telemetryProfile as typeof TelemetryProfile;
        let telemetry = new telemetryProfile(benchConfig, this.logger);
        await telemetry.asyncConstruct(benchConfig);


        await new WorkersWrapper(
            this.config.profileFileName,
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

export default function (blockchainModule: BlockchainModule) {
    let config = new Config();
    return new BenchRunner(blockchainModule, config);
}
