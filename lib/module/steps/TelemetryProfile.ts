import Step from "./Step";
import Logger from "../../resources/Logger";

export interface TelemetryData {
    avgTps: number,
    lastLocalTps: number,
    processedTransactions: number,
    processedTransactionsPerThread: number[],
    benchTime: number,
}

export default class TelemetryProfile extends Step {

    static readonly fileName = __filename;

    protected benchConfig: any;

    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    // Should be fast
    // noinspection JSUnusedLocalSymbols
    onKeyPoint(d: TelemetryData) {

    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    onBenchEnded(d: TelemetryData): Promise<any> {
        return Promise.resolve();
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    asyncConstruct(benchConfig: any): Promise<any> {
        return Promise.resolve();
    }
}
