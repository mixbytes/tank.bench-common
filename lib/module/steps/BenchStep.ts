import Step from "./Step";
import Logger from "../../resources/Logger";

export default abstract class BenchStep extends Step {

    protected benchConfig: any;

    protected constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    abstract async commitBenchmarkTransaction(uniqueData: any): Promise<any>;
}
