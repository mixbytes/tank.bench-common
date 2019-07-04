import Step from "./Step";
import Logger from "../../resources/Logger";
import {WORKER_ERROR_NO_IMPLEMENTATION} from "../../worker/WorkersWrapper";

export interface TransactionResult {
    code: number,
    error: any
}

export default abstract class BenchCase extends Step {

    protected benchConfig: any;

    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(benchConfig: any, logger: Logger) {
        super(logger);
        this.benchConfig = benchConfig;
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    commitTransaction(uniqueData: string): Promise<TransactionResult> {
        return Promise.resolve({
            code: WORKER_ERROR_NO_IMPLEMENTATION,
            error: new Error(`You should override "commitTransaction" method`)
        })
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    asyncConstruct(threadId: number): Promise<any> {
        return Promise.resolve();
    }
}
