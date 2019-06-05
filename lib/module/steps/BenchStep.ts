import Step from "./Step";
import Logger from "../../resources/Logger";

export default abstract class BenchStep extends Step {

    protected benchConfig: any;

    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    abstract async commitBenchmarkTransaction(uniqueData: any): Promise<number>;

    // noinspection JSMethodCanBeStatic
    async asyncConstruct(threadId: number): Promise<any> {
        return Promise.resolve();
    }
}
