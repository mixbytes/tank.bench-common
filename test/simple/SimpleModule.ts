import {BlockchainModule, BuiltinProfile} from "../../lib";

import SimpleBenchProfile from "./SimpleProfile";
import ErrorBenchProfile from "./ErrorProfile";
import DefaultBenchProfile from "./DefaultProfile"
import SimpleProfileNoConfig from "./SimpleProfileNoConfig"

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
                profile: SimpleProfileNoConfig,
                name: "noConfig"
            },

            {
                profile: ErrorBenchProfile,
                name: "error"
            },
        ]
    }

    getDefaultConfigFilePath(): string | null {
        return "test/simple/simple.bench.config.json";
    }


    getConfigSchema(): any {
        return {
            hello: {
                type: "String",
                default: "not world"
            }
        }
    }
}
