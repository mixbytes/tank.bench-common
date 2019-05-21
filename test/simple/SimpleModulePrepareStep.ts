import {PrepareStep} from "../../lib";

export default class SimpleModulePrepareStep extends PrepareStep {
    async prepare(): Promise<any> {
        return new Promise<any>(resolve => {
            setTimeout(resolve, 1000);
        });
    }
}
