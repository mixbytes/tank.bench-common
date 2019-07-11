import {BenchProfile, TransactionResult} from "../../lib";

export default class SimpleBenchProfile extends BenchProfile {

    static readonly fileName = __filename;

    commitTransaction(uniqueData: string): Promise<TransactionResult> {
        return new Promise(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 1);
        });
    }
}
