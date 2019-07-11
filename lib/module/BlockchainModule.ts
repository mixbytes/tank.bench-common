import BenchRunner from "../runner/BenchRunner";
import BuiltinProfile from "./steps/BuiltinProfile";

export default abstract class BlockchainModule {
    abstract getConfigSchema(): any;

// noinspection JSMethodCanBeStatic
    getBuiltinProfiles(): BuiltinProfile[] {
        return [];
    }

// noinspection JSMethodCanBeStatic
    getDefaultConfigFilePath(): string | null {
        return null;
    }

    bench(exit = true): Promise<any> {
        return new BenchRunner(this).bench(exit)
    }
}
