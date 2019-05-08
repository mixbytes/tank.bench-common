import Logger from "../resources/Logger";
import BenchStep from "./steps/BenchStep";
import PrepareStep from "./steps/PrepareStep";

export default interface BlockchainModule {
    createBenchStep(config: any, logger: Logger): BenchStep;

    createPrepareStep(config: any, logger: Logger): PrepareStep;

    getFileName(): string;
}
