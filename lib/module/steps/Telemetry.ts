import Step from "./Step";
import Logger from "../../resources/Logger";

export interface TelemetryData {
    avgTps: number,
    lastLocalTps: number,
    processedTransactions: number,
    processedTransactionsPerThread: number[],
    benchTime: number,
}

export default abstract class Telemetry extends Step {

    protected benchConfig: any;

    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    // Should be fast
    abstract onKeyPoint(d: TelemetryData): any;

    abstract onBenchEnded(d: TelemetryData): Promise<any>;

    // noinspection JSMethodCanBeStatic
    asyncConstruct(): Promise<any> {
        return Promise.resolve();
    }
}
