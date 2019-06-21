import {BenchStep, TransactionResult} from "../../lib";

export default class SimpleModuleBenchStep extends BenchStep {
    async commitBenchmarkTransaction(uniqueData: any): Promise<TransactionResult> {
        return new Promise<TransactionResult>(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 100);
        });
    }


    async asyncConstruct(threadId: number): Promise<any> {
        if (Math.random() > 0.5)
            throw new Error("wft");
        return Promise.resolve();
    }
}
