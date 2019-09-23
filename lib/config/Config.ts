import BlockchainModule from "../module/BlockchainModule";
import Strings from "../resources/Strings";
import * as convict from "convict";
import Profile from "../module/Profile";
import {resolve} from "path";
import TelemetryProfile from "../module/steps/TelemetryProfile";
import PreparationProfile from "../module/steps/PreparationProfile";
import CommonConfigSchema from "./CommonConfigSchema";

export default class Config {
    private _commonConfig: any;
    private _moduleConfig: any;
    private _profile!: Profile;
    private _profileFileName!: string;

    get profileFileName(): string {
        return this._profileFileName;
    }

    get profile(): Profile {
        return this._profile;
    }

    private static async getProfile(blockchainModule: BlockchainModule): Promise<{ profile: Profile, profileFileName: string }> {
        let arg = Config.processArg(Strings.constants.benchProfileFilePathArgs());
        if (arg) {
            for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
                let builtinProfile = blockchainModule.getBuiltinProfiles()[i];
                if (builtinProfile.name === arg) {
                    let profile = builtinProfile;

                    if (profile.configSchema) {
                        throw new Error("Builtin profile MUST NOT export own schema, but needs to use the module's one.");
                    }

                    if (!profile.preparationProfile) {
                        console.warn(`The ${builtinProfile.name} profile don't export PREPARATION profile, so default one is used!`);
                        profile.preparationProfile = PreparationProfile;
                    }

                    if (!profile.telemetryProfile) {
                        console.warn(`The ${builtinProfile.name} profile don't export TELEMETRY profile, so default one is used!`);
                        profile.telemetryProfile = TelemetryProfile;
                    }

                    return {profile, profileFileName: profile.fileName};
                }
            }

            let profileImport = await import(resolve(arg));
            let profile: Profile;
            if (profileImport.default) {
                profile = profileImport.default;
            } else {
                profile = profileImport;
            }

            for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
                let builtinProfile = blockchainModule.getBuiltinProfiles()[i];
                if (builtinProfile.name === "default") {
                    if (profile.preparationProfile === "takeFromBlockchainModuleDefaultProfile") {
                        profile.preparationProfile = builtinProfile.preparationProfile;
                        console.warn(`The PREPARATION profile is taken from default profile for module!`);
                        if (!profile.preparationProfile) {
                            console.warn(`Module's default profile don't export PREPARATION profile, so default one is used!`);
                            profile.preparationProfile = PreparationProfile;
                        }
                    }
                    if (profile.telemetryProfile === "takeFromBlockchainModuleDefaultProfile") {
                        profile.telemetryProfile = builtinProfile.telemetryProfile;
                        console.warn(`The TELEMETRY profile is taken from default profile for module!`);
                        if (!profile.telemetryProfile) {
                            console.warn(`Module's default profile don't export TELEMETRY profile, so default one is used!`);
                            profile.telemetryProfile = TelemetryProfile;
                        }
                    }
                }
            }

            if (!profile.preparationProfile) {
                console.warn(`The ${arg} profile does not export the PREPARATION profile, so default one is used!`);
                profile.preparationProfile = PreparationProfile;
            }

            if (!profile.telemetryProfile) {
                console.warn(`The ${arg} profile does not export the TELEMETRY profile, so default one is used!`);
                profile.telemetryProfile = TelemetryProfile;
            }

            return {profile, profileFileName: arg};
        }

        for (let i = 0; i < blockchainModule.getBuiltinProfiles().length; i++) {
            let builtinProfile = blockchainModule.getBuiltinProfiles()[i];
            if (builtinProfile.name === "default") {
                console.warn(`The default profile is used!`);
                console.warn(`You can specify the profile (using -p or --profile flag)`);
                let profile = builtinProfile;

                if (!profile.preparationProfile) {
                    console.warn(`Module's default profile don't export PREPARATION profile, so default one is used!`);
                    profile.preparationProfile = PreparationProfile;
                }

                if (!profile.telemetryProfile) {
                    console.warn(`Module's default profile don't export TELEMETRY profile, so default one is used!`);
                    profile.telemetryProfile = TelemetryProfile;
                }
                return {profile, profileFileName: profile.fileName};
            }
        }

        throw new Error("You need to specify the profile (using -p or --profile flag)");
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

    getCommonConfig() {
        return this.getCommonConfigInternal(CommonConfigSchema);
    }

    async init(blockchainModule: BlockchainModule) {

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

        let profileAndName = await Config.getProfile(blockchainModule);
        this._profile = profileAndName.profile;
        this._profileFileName = profileAndName.profileFileName;

        const commonConvict = convict(CommonConfigSchema);

        commonConvict.loadFile(commonConfigFilePath);
        try {
            commonConvict.validate({allowed: "strict"});
        } catch (e) {
            console.error("There is an error in the config of common module. Here is a schema:\n");
            console.error(Config.getConvictDocumentation(commonConvict));
            throw e;
        }
        this._commonConfig = commonConvict;

        this.validateCommonConfig();

        if (this.profile.configSchema) {
            const moduleConvict = convict(this.profile.configSchema);
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
    }

    getModuleConfig(): any {
        if (!this._moduleConfig) {
            return undefined;
        }
        return {...this._moduleConfig};
    }

    private getCommonConfigInternal<T>({}: convict.Schema<T> | string): T {
        return this._commonConfig.getProperties();
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
        let props = this.getCommonConfig();
        if (props.prometheusTelemetry.enable && props.prometheusTelemetry.url === "")
            throw new Error("If you enable prometheus telemetry, you must specify it's endpoint URL in config.");
    }
}
