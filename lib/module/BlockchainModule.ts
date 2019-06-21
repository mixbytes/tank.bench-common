import Logger from "../resources/Logger";
import BenchStep from "./steps/BenchStep";
import PrepareStep from "./steps/PrepareStep";
import BenchTelemetryStep, {TelemetryData} from "./steps/BenchTelemetryStep";

class DefaultPrepareStep extends PrepareStep {
    async prepare(): Promise<any> {
        return {
            commonConfig: this.commonConfig,
            moduleConfig: this.moduleConfig
        }
    }
}

class DefaultBenchTelemetryStep extends BenchTelemetryStep {
    onBenchEnded(d: TelemetryData): Promise<any> {
        return Promise.resolve();
    }

    onKeyPoint(d: TelemetryData): any {
    }
}

export default abstract class BlockchainModule {
    abstract createBenchStep(benchConfig: any, logger: Logger): BenchStep;

    createPrepareStep(commonConfig: any, moduleConfig: any, logger: Logger): PrepareStep {
        return new DefaultPrepareStep(commonConfig, moduleConfig, logger);
    }

    createBenchTelemetryStep(benchConfig: any, logger: Logger): BenchTelemetryStep {
        return new DefaultBenchTelemetryStep(benchConfig, logger);
    }

    abstract getConfigSchema(): any;

    abstract getFileName(): string;

    // noinspection JSMethodCanBeStatic
    getDefaultConfigFilePath(): string | null {
        return null;
    }
}
