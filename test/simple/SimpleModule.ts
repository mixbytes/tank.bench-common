import {BlockchainModule, BuiltinBenchProfile, Logger, Preparation} from "../../lib";
import SimpleModulePreparation from "./SimpleModulePreparation";
import SimpleBenchProfile from "./SimpleBenchProfile";


export default class SimpleModule extends BlockchainModule {

    createPreparationStep(commonConfig: any, moduleConfig: any, logger: Logger): Preparation {
        return new SimpleModulePreparation(commonConfig, moduleConfig, logger);
    }

    getBuiltinProfiles(): BuiltinBenchProfile[] {
        return [SimpleBenchProfile.benchProfile]
    }

    getConfigSchema(): any {
        return {
            hello: {
                type: "String",
                default: name
            }
        }
    }

    getDefaultConfigFilePath(): string | null {
        return "test/simple/simple.bench.config.json";
    }
}
