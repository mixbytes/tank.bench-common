import {AnyProfileType} from "../profile/Profile";
import {CommonConfig, schema} from "./CommonConfigSchema";
import {Strings} from "../resources/Strings";
import {processArg} from "../tools/Tools";
import convict = require("convict");

export default class ProfileConfig {

    public readonly commonConfig: CommonConfig;
    public readonly moduleConfig: any;


    constructor(commonConfig: CommonConfig, moduleConfig: any) {
        this.commonConfig = commonConfig;
        this.moduleConfig = moduleConfig;
    }

    public static from(profile: AnyProfileType): ProfileConfig {

        const commonArg = processArg(Strings.constants.commonConfigFilePathArgs());
        const commonFilePath = commonArg ? commonArg : Strings.constants.commonConfigFilePath();

        const moduleArg = processArg(Strings.constants.moduleConfigFilePathArgs());
        const moduleFilePath = moduleArg ? moduleArg : Strings.constants.moduleConfigFilePath();

        return new ProfileConfig(
            this.loadConfig(schema, commonFilePath, "common"),
            this.loadConfig(profile.configSchema, moduleFilePath, "profile"),
        );
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

    private static loadConfig<T>(schema: convict.Schema<T>, file: string, moduleName: string): T {
        const config = convict(schema);
        config.loadFile(file);
        try {
            config.validate({allowed: "strict"});
        } catch (e) {
            console.error(`There is an error in the config of ${moduleName} module. Here is a schema:\n`);
            console.error(this.getConvictDocumentation(config));
            throw e;
        }
        return config.getProperties();
    }
}
