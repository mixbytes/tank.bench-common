import Step from "./Step";
import Logger from "../../resources/Logger";

export interface TelemetryData {
    avgTps: number,
    lastLocalTps: number,
    processedTransactions: number,
    processedTransactionsPerThread: number[],
    benchTime: number,
}

export default abstract class BenchTelemetryStep extends Step {

    protected benchConfig: any;

    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    // Should be fast
    abstract onKeyPoint(d: TelemetryData): any;

    abstract async onBenchEnded(d: TelemetryData): Promise<any>;

    // noinspection JSMethodCanBeStatic
    async asyncConstruct(): Promise<any> {
        return Promise.resolve();
    }
}
