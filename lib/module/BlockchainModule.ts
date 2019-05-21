import Logger from "../resources/Logger";
import BenchStep from "./steps/BenchStep";
import PrepareStep from "./steps/PrepareStep";

export default abstract class BlockchainModule {
    abstract createBenchStep(benchConfig: any, logger: Logger): BenchStep;

    abstract createPrepareStep(commonConfig: any, moduleConfig: any, logger: Logger): PrepareStep;

    abstract getConfigSchema(): any;

    abstract getFileName(): string;

    // noinspection JSMethodCanBeStatic
    getDefaultConfigFilePath(): string | null {
        return null;
    }
}
