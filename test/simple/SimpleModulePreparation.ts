import {Preparation} from "../../lib";

export default class SimpleModulePreparation extends Preparation {
    async prepare() {
        return {hello: "world", commonConfig: this.commonConfig};
    }
}
