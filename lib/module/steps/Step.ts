import Logger from "../../resources/Logger";

export default class Step {

    protected readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }
}
