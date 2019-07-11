import {BlockchainModule, BuiltinProfile} from "../../lib";
import DefaultPreparationProfile from "./DefaultPreparationProfile";

import SimpleBenchProfile from "./SimpleBenchProfile";
import DefaultBenchProfile from "./DefaultBenchProfile";
import ErrorBenchProfile from "./ErrorBenchProfile";


export default class SimpleModule extends BlockchainModule {
    getBuiltinProfiles(): BuiltinProfile[] {
        return [
            {
                preparationFile: DefaultPreparationProfile.fileName,
                benchFile: DefaultBenchProfile.fileName,
                telemetryFile: null,
                name: "default"
            },

            {
                preparationFile: DefaultPreparationProfile.fileName,
                benchFile: SimpleBenchProfile.fileName,
                telemetryFile: null,
                name: "SimpleBenchProfile"
            },

            {
                preparationFile: DefaultPreparationProfile.fileName,
                benchFile: ErrorBenchProfile.fileName,
                telemetryFile: null,
                name: "error"
            },
        ]
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
