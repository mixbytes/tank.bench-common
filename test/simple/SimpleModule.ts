import {BlockchainModule, BuiltinProfile} from "../../lib";

import SimpleBenchProfile from "./SimpleProfile";
import ErrorBenchProfile from "./ErrorProfile";
import DefaultBenchProfile from "./DefaultProfile"

export default class SimpleModule extends BlockchainModule {
    getBuiltinProfiles(): BuiltinProfile[] {
        return [
            {
                profile: DefaultBenchProfile,
                name: "default"
            },

            {
                profile: SimpleBenchProfile,
                name: "SimpleBenchProfile"
            },

            {
                profile: ErrorBenchProfile,
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
