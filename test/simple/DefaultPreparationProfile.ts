import {PreparationProfile} from "../../lib";

export default class DefaultPreparationProfile extends PreparationProfile {
    async prepare() {
        return {hello: "world", commonConfig: this.commonConfig};
    }
}


