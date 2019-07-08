import {BenchProfile, BuiltinBenchProfile, TransactionResult} from "../../lib";

export default class SimpleBenchProfile extends BenchProfile {

    static readonly benchProfile: BuiltinBenchProfile = {
        fileName: __filename,
        name: "SimpleBenchProfile"
    };

    commitTransaction(uniqueData: string): Promise<TransactionResult> {
        return new Promise(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 10);
        });
    }
}
