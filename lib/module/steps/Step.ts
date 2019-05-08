import Logger from "../../resources/Logger"

export default class Step {
    protected config: any;
    protected logger: Logger;

    constructor(config: any, logger: Logger) {
        this.config = config;
        this.logger = logger;
    }

    // noinspection JSMethodCanBeStatic
    async asyncConstruct(): Promise<any> {
        return Promise.resolve();
    }
}
