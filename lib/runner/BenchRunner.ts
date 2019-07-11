import Strings from "../resources/Strings";
import BlockchainModule from "../module/BlockchainModule";
import Logger from "../resources/Logger";
import WorkersWrapper from "../worker/WorkersWrapper";
import Config from "../config/Config";
import PrometheusPusher from "../metrics/PrometheusPusher";
import {resolve} from "path";
import PreparationProfile from "../module/steps/PreparationProfile";
import TelemetryProfile from "../module/steps/TelemetryProfile";

export default class BenchRunner {
    private readonly blockchainModule: BlockchainModule;
    private readonly config!: Config;
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

    async bench(exit = true) {
        let prometheusPusher = undefined;

        // Prepare prometheus
        if (this.commonConfig.prometheusTelemetry.enable) {
            this.logger.log(Strings.log.preparingTelemetry());
            prometheusPusher = new PrometheusPusher(this.commonConfig);
            await prometheusPusher.test();
            this.logger.log(Strings.log.preparingTelemetrySuccess());
        }

        // Process prepare profile
        let preparationProfileImport = await import(resolve(this.config.preparationProfilePath));
        let prepareStep!: PreparationProfile;
        if (preparationProfileImport.default) {
            prepareStep = <PreparationProfile>new preparationProfileImport.default(this.commonConfig, this.moduleConfig, this.logger);
        } else {
            prepareStep = <PreparationProfile>new preparationProfileImport(this.commonConfig, this.moduleConfig, this.logger);
        }

        await prepareStep.asyncConstruct(this.commonConfig, this.moduleConfig);
        let benchConfig = await prepareStep.prepare(this.commonConfig, this.moduleConfig);

        // Process telemetry profile
        let telemetryProfileImport = await import(resolve(this.config.telemetryProfilePath));
        let telemetryProfile!: TelemetryProfile;
        if (telemetryProfileImport.default) {
            telemetryProfile = <TelemetryProfile>new telemetryProfileImport.default(this.commonConfig, this.moduleConfig, this.logger);
        } else {
            telemetryProfile = <TelemetryProfile>new telemetryProfileImport(this.commonConfig, this.moduleConfig, this.logger);
        }

        await telemetryProfile.asyncConstruct(benchConfig);

        await new WorkersWrapper(
            this.config.benchProfilePath,
            telemetryProfile,
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
