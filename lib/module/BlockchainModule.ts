import BenchRunner from "../runner/BenchRunner";
import BuiltinProfile from "./steps/BuiltinProfile";

export default abstract class BlockchainModule {
// noinspection JSMethodCanBeStatic
    getBuiltinProfiles(): BuiltinProfile[] {
        return [];
    }

// noinspection JSMethodCanBeStatic
    getDefaultConfigFilePath(): string | null {
        return null;
    }

    bench(exit = true): Promise<any> {
        return BenchRunner(this).bench(exit)
    }
}
