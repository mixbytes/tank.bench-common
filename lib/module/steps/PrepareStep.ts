import Step from "./Step";

export default abstract class PrepareStep extends Step {
    abstract async prepare(): Promise<any>;
}
