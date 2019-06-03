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
        try {
            commonConvict.validate({allowed: "strict"});
        } catch (e) {
            console.error("There is an error in the config of common module. Here is a schema:\n");
            console.error(Config.getConvictDocumentation(commonConvict));
            throw e;
        }
        this._commonConfig = commonConvict.getProperties();

        const moduleConvict = convict(blockchainModule.getConfigSchema());
        moduleConvict.loadFile(moduleConfigFilePath);
        try {
            moduleConvict.validate({allowed: "strict"});
        } catch (e) {
            console.error("There is an error in the config of your module. Here is a schema:\n");
            console.error(Config.getConvictDocumentation(moduleConvict));
            throw e;
        }
        this._moduleConfig = moduleConvict.getProperties();
    }

    static getConvictDocumentation = (convict: convict.Config<any>) => {
        let documentation = "";
        const recursion = (level: number, prefix: string, obj: any) => {
            Object.keys(obj).forEach(key => {
                let value = obj[key];
                if (value.properties) {
                    let doc = value.doc ? ` - ${value.doc}` : '';
                    documentation += `${"   ".repeat(level)}${key}${doc}\n`;
                    return recursion(level + 1, `${prefix}${key}.`, value.properties);
                }
                let doc = value.doc ? ` - ${value.doc}` : '';
                documentation += `${"   ".repeat(level)}${prefix}${key}${doc}\n`;
            });
        };
        recursion(0, "", convict.getSchema().properties);
        return documentation.trim();
    };

    getCommonConfig(): any {
        return {...this._commonConfig};
    }

    getModuleConfig(): any {
        return {...this._moduleConfig};
    }
}
