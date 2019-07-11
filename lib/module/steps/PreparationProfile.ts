import Step from "./Step";
import Logger from "../../resources/Logger";

export default class PreparationProfile extends Step {

    static readonly fileName = __filename;

    protected commonConfig: any;
    protected moduleConfig: any;

    constructor(commonConfig: any, moduleConfig: any, logger: Logger) {
        super(logger);
        this.commonConfig = commonConfig;
        this.moduleConfig = moduleConfig;
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    asyncConstruct(commonConfig: any, moduleConfig: any): Promise<any> {
        return Promise.resolve();
    }

    prepare(commonConfig: any, moduleConfig: any): Promise<any> {
        return Promise.resolve({
            commonConfig: this.commonConfig,
            moduleConfig: this.moduleConfig
        })
    }
}
