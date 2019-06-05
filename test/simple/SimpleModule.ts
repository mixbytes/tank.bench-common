import {BenchStep, BenchTelemetryStep, BlockchainModule, Logger, PrepareStep} from "../../lib";
import SimpleModuleBenchStep from "./SimpleModuleBenchStep";
import SimpleModulePrepareStep from "./SimpleModulePrepareStep";
import SimpleModuleBenchTelemetryStep from "./SimpleModuleBenchTelemetryStep";

export default class SimpleModule extends BlockchainModule {
    createBenchStep(benchConfig: any, logger: Logger): BenchStep {
        return new SimpleModuleBenchStep(benchConfig, logger);
    }

    createPrepareStep(commonConfig: any, moduleConfig: any, logger: Logger): PrepareStep {
        return new SimpleModulePrepareStep(commonConfig, moduleConfig, logger);
    }

    createBenchTelemetryStep(benchConfig: any, logger: Logger): BenchTelemetryStep {
        return new SimpleModuleBenchTelemetryStep(benchConfig, logger);
    }

    getConfigSchema(): any {
        return {
            hello: {
                type: "String",
                default: name
            }
        }
    }

    getDefaultConfigFilePath(): string | null {
        return "test/simple/simple.bench.config.json";
    }

    getFileName(): string {
        return __filename;
    }
}
