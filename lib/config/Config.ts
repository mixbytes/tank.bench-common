import BlockchainModule from "../module/BlockchainModule";
import Strings from "../resources/Strings";
import CommonConfigSchema from "./CommonConfigSchema";
import * as convict from "convict";

export default class Config {
    private readonly _commonConfig: any;
    private readonly _moduleConfig: any;

    constructor(blockchainModule: BlockchainModule) {

        let moduleDefaultConfigFilePath = blockchainModule.getDefaultConfigFilePath();

        let commonConfigFilePath = Strings.constants.commonConfigFilePath();
        let moduleConfigFilePath = moduleDefaultConfigFilePath ?
            moduleDefaultConfigFilePath : Strings.constants.moduleConfigFilePath();

        process.argv.forEach(processArg => {
            Strings.constants.commonConfigFilePathArgs().forEach(arg => {
                if (processArg.startsWith(arg)) {
                    commonConfigFilePath = processArg.substr(arg.length);
                }
            });
        });

        process.argv.forEach(processArg => {
            Strings.constants.moduleConfigFilePathArgs().forEach(arg => {
                if (processArg.startsWith(arg)) {
                    moduleConfigFilePath = processArg.substr(arg.length);
                }
            });
        });

        const commonConvict = convict(CommonConfigSchema);
        commonConvict.loadFile(commonConfigFilePath);
        commonConvict.validate({allowed: "strict"});
        this._commonConfig = commonConvict.getProperties();

        const moduleConvict = convict(blockchainModule.getConfigSchema());
        moduleConvict.loadFile(moduleConfigFilePath);
        moduleConvict.validate({allowed: "strict"});
        this._moduleConfig = moduleConvict.getProperties();
    }

    getCommonConfig(): any {
        return {...this._commonConfig};
    }

    getModuleConfig(): any {
        return {...this._moduleConfig};
    }
}
