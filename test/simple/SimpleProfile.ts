import {BenchProfile, Profile, TransactionResult} from "../../lib";
import DefaultPreparationProfile from "./DefaultPreparationProfile";

class SimpleProfile extends BenchProfile {
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
    configSchema: {
        hello: {
            type: "String",
            default: "not world"
        }
    },
    fileName: __filename,
    benchProfile: SimpleProfile,
    preparationProfile: DefaultPreparationProfile,
    telemetryProfile: undefined
};

export default profile;

