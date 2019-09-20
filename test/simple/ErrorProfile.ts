import {BenchProfile, BuiltinProfile, TransactionResult} from "../../lib";

class ErrorProfile extends BenchProfile {

    async asyncConstruct(threadId: number) {
        if (threadId == this.benchConfig.commonConfig.threadsAmount - 1)
            throw new Error("some error");
    }

    commitTransaction(uniqueData: string): Promise<TransactionResult> {
        return new Promise(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 1);
        });
    }
}

const profile: BuiltinProfile = {
    fileName: __filename,
    name: "error",
    benchProfile: ErrorProfile
};

export default profile;
