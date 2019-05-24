import {BenchStep} from "../../lib";

export default class SimpleModuleBenchStep extends BenchStep {
    async commitBenchmarkTransaction(uniqueData: any): Promise<any> {
        return new Promise<any>(resolve => {
            setTimeout(resolve, 100);
        });
    }
}
