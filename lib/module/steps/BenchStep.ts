import Step from "./Step";

export default abstract class BenchStep extends Step {
    abstract async commitBenchmarkTransaction(uniqueData: any): Promise<any>;
}
