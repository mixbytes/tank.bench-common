import Step from "./Step";
import Logger from "../../resources/Logger";

export default abstract class PrepareStep extends Step {

    protected commonConfig: any;
    protected moduleConfig: any;

    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(commonConfig: any, moduleConfig: any, logger: Logger) {
        super(logger);
        this.commonConfig = commonConfig;
        this.moduleConfig = moduleConfig;
    }

    abstract async prepare(): Promise<any>;
}
