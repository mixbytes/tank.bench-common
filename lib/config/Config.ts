import BlockchainModule from "../module/BlockchainModule";
import Strings from "../resources/Strings";
import CommonConfigSchema from "./CommonConfigSchema";
import * as convict from "convict";
import PreparationProfile from "../module/steps/PreparationProfile";
import TelemetryProfile from "../module/steps/TelemetryProfile";
import BuiltinProfile from "../module/steps/BuiltinProfile";

export default class Config {
    private readonly _commonConfig: any;
    private readonly _moduleConfig: any;
    private readonly _benchProfilePath: string;
    private readonly _preparationProfilePath: string;
    private readonly _telemetryProfilePath: string;

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
        this._preparationProfilePath = Config.getPreparationProfilePath(blockchainModule);
        this._telemetryProfilePath = Config.getTelemetryProfilePath(blockchainModule);

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

    get preparationProfilePath(): string {
        return this._preparationProfilePath;
    }

    get telemetryProfilePath(): string {
        return this._telemetryProfilePath;
    }

    private static getProfilePath(blockchainModule: BlockchainModule,
                                  args: string[],
                                  fieldName: string,
                                  helpName: string,
                                  helpFlags: string[],
                                  checkNull: string | null
    ) {
        let useProfile = (profile: BuiltinProfile) => {
            // @ts-ignore
            let defaultField = profile[fieldName];

            if (checkNull == null)
                return defaultField;

            if (defaultField === null) {
                console.warn(`${helpName} implementation is default for tank!`);
                return checkNull;
            }

            return defaultField;
        };

        let arg = Config.processArg(Strings.constants.commonProfileFilePathArgs());
        if (arg) {
            for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
                let profile = blockchainModule.getBuiltinProfiles()[i];
                if (profile.name === arg) {
                    return useProfile(profile)
                }
            }
            return arg;
        }

        arg = Config.processArg(args);
        if (arg) {
            for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
                let profile = blockchainModule.getBuiltinProfiles()[i];
                if (profile.name === arg) {
                    return useProfile(profile)
                }
            }
            return arg;
        }

        for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
            let profile = blockchainModule.getBuiltinProfiles()[i];
            if (profile.name === "default") {
                console.warn(`The default ${helpName} profile is used!`);
                console.warn(`You can specify the ${helpName} profile (using ${helpFlags.reduce((hf, acc, i) => `${hf}${acc}${i !== helpFlags.length - 1 ? " or " : ""}`, "")} flag)`);
                return useProfile(profile)
            }
        }

        throw new Error("You need to specify the BENCH profile (using -b=<bench_profile_file> or --bench-profile=<bench_profile_file> flag)");
    }

    private static getBenchProfilePath(blockchainModule: BlockchainModule) {
        return Config.getProfilePath(
            blockchainModule,
            Strings.constants.benchProfileFilePathArgs(),
            "benchFile",
            "BENCH",
            ["-b=<bench_profile_file>", "--bench-profile=<bench_profile_file>"],
            null
        )
    }

    get benchProfilePath(): string {
        return this._benchProfilePath;
    }

    private static getPreparationProfilePath(blockchainModule: BlockchainModule) {
        return Config.getProfilePath(
            blockchainModule,
            Strings.constants.preparationProfileFilePathArgs(),
            "preparationFile",
            "PREPARATION",
            ["-p=<preparation_profile_file>", "--preparation-profile=<preparation_profile_file>"],
            PreparationProfile.fileName
        )
    }

    private static getTelemetryProfilePath(blockchainModule: BlockchainModule) {
        return Config.getProfilePath(
            blockchainModule,
            Strings.constants.telemetryProfileFilePathArgs(),
            "telemetryFile",
            "TELEMETRY",
            ["-t=<telemetry_profile_file>", "--telemetry-profile=<telemetry_profile_file>"],
            TelemetryProfile.fileName
        )
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
            throw new Error("If you enable prometheus telemetry, you must specify it's endpoint URL in config.");
    }
}
