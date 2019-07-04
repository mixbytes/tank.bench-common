import {Preparation} from "../../lib";

export default class SimpleModulePreparation extends Preparation {
    async prepare() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {hello: "world"};
    }
}
