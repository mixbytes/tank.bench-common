import BlockchainModule from "../module/BlockchainModule";
import Strings from "../resources/Strings";
import CommonConfigSchema from "./CommonConfigSchema";
import * as convict from "convict";

export default class Config {
    private readonly _commonConfig: any;
    private readonly _moduleConfig: any;
    private readonly _benchProfilePath: string;

    constructor(blockchainModule: BlockchainModule) {

        let moduleDefaultConfigFilePath = blockchainModule.getDefaultConfigFilePath();

        let commonConfigFilePath = Strings.constants.commonConfigFilePath();
        let moduleConfigFilePath = moduleDefaultConfigFilePath ?
            moduleDefaultConfigFilePath : Strings.constants.moduleConfigFilePath();

        let arg = Config.processArg(Strings.constants.commonConfigFilePathArgs());
        if (arg) {
            commonConfigFilePath = arg;
        }

        arg = Config.processArg(Strings.constants.moduleConfigFilePathArgs());
        if (arg) {
            moduleConfigFilePath = arg;
        }

        this._benchProfilePath = Config.getBenchProfilePath(blockchainModule);

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

        this.validateCommonConfig();

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

    private static getBenchProfilePath(blockchainModule: BlockchainModule): string {
        if (blockchainModule.benchProfilePath)
            return blockchainModule.benchProfilePath;

        let arg = Config.processArg(Strings.constants.benchProfileFilePathArgs());

        if (arg) {
            for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
                let c = blockchainModule.getBuiltinProfiles()[i];
                if (c.name === arg) {
                    return c.fileName;
                }
            }
            return arg;
        }

        for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
            let c = blockchainModule.getBuiltinProfiles()[i];
            if (c.name === "default") {
                console.warn("The default bench profile is used!");
                console.warn("You can specify the bench profile (using -p=<case_file> or --profile=<builtin_case_name> flag)");
                return c.fileName;
            }
        }

        throw new Error("You need to specify the bench profile (using -p=<case_file> or --profile=<builtin_case_name> flag)");
    }

    get benchProfilePath(): string {
        return this._benchProfilePath;
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

    private static processArg(argVariants: string[]): string | null {
        let ans = null;
        process.argv.forEach(processArg => {
            argVariants.forEach(arg => {
                if (processArg.startsWith(arg)) {
                    ans = processArg.substr(arg.length);
                }
            });
        });
        return ans
    }

    private validateCommonConfig() {
        if (this._commonConfig.prometheusTelemetry.enable && this._commonConfig.prometheusTelemetry.url === "")
            throw new Error("If you enable prometheus telemerty, you must specify it's endpoint URL in config.");
    }
}
