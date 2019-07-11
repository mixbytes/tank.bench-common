import {PreparationProfile} from "../../lib";

export default class DefaultPreparationProfile extends PreparationProfile {

    static readonly fileName = __filename;

    async prepare() {
        return {hello: "world", commonConfig: this.commonConfig};
    }
}
