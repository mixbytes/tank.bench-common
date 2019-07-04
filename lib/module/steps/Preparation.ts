import Step from "./Step";
import Logger from "../../resources/Logger";

export default abstract class Preparation extends Step {

    protected commonConfig: any;
    protected moduleConfig: any;

    constructor(commonConfig: any, moduleConfig: any, logger: Logger) {
        super(logger);
        this.commonConfig = commonConfig;
        this.moduleConfig = moduleConfig;
    }

    // noinspection JSMethodCanBeStatic
    asyncConstruct(): Promise<any> {
        return Promise.resolve();
    }

    abstract prepare(): Promise<any>;
}
