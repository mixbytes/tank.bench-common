import {BenchStep} from "../../lib";

export default class SimpleModuleBenchStep extends BenchStep {
    async commitBenchmarkTransaction(uniqueData: any): Promise<number> {
        return new Promise<any>(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve(code)
            }, 100);
        });
    }
}
