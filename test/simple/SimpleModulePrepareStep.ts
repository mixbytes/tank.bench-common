import {PrepareStep} from "../../lib";

export default class SimpleModulePrepareStep extends PrepareStep {
    async prepare() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {hello: "world"};
    }
}
