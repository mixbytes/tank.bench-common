import {BenchProfile, Profile, TransactionResult} from "../../lib";
import DefaultPreparationProfile from "./DefaultPreparationProfile";

class DefaultProfile extends BenchProfile {
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
    benchProfile: DefaultProfile,
    preparationProfile: DefaultPreparationProfile,
    telemetryProfile: undefined
};

export default profile;
