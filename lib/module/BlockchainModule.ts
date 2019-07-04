import Logger from "../resources/Logger";
import Preparation from "./steps/Preparation";
import Telemetry, {TelemetryData} from "./steps/Telemetry";
import BenchRunner from "../runner/BenchRunner";

class DefaultPrepareStep extends Preparation {
    async prepare(): Promise<any> {
        return {
            commonConfig: this.commonConfig,
            moduleConfig: this.moduleConfig
        }
    }
}

class DefaultBenchTelemetryStep extends Telemetry {
    onBenchEnded(d: TelemetryData): Promise<any> {
        return Promise.resolve();
    }

    onKeyPoint(d: TelemetryData): any {
    }
}

export default abstract class BlockchainModule {
    private readonly _benchCasePath?: string;

    constructor();
    constructor(benchCasePath: string);
    constructor(benchCasePath?: string) {
        this._benchCasePath = benchCasePath;
    }

    get benchCasePath(): string | undefined {
        return this._benchCasePath;
    }

    createPreparationStep(commonConfig: any, moduleConfig: any, logger: Logger): Preparation {
        return new DefaultPrepareStep(commonConfig, moduleConfig, logger);
    }

    abstract getConfigSchema(): any;

// noinspection JSMethodCanBeStatic
    createTelemetryStep(benchConfig: any, logger: Logger): Telemetry {
        return new DefaultBenchTelemetryStep(benchConfig, logger);
    }

// noinspection JSMethodCanBeStatic
    getDefaultConfigFilePath(): string | null {
        return null;
    }

    bench(): Promise<any> {
        return new BenchRunner(this).bench()
    }
}
