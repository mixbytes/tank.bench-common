import {BenchProfile, Profile, TransactionResult} from "../../lib";

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

const profile: Profile = {
    fileName: __filename,
    benchProfile: ErrorProfile,
    preparationProfile: undefined,
    telemetryProfile: undefined,
    configSchema: {
        hello: {
            type: "String",
            default: "not world"
        }
    },
};

export default profile;
