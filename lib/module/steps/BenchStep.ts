import Step from "./Step";
import Logger from "../../resources/Logger";

export interface TransactionResult {
    code: number,
    error: any
}

export default abstract class BenchStep extends Step {

    protected benchConfig: any;

    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    abstract async commitBenchmarkTransaction(uniqueData: any): Promise<TransactionResult>;

    // noinspection JSMethodCanBeStatic
    async asyncConstruct(threadId: number): Promise<any> {
        return Promise.resolve();
    }
}
