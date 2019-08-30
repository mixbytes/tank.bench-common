import BenchProfile from "./steps/BenchProfile";
import PreparationProfile from "./steps/PreparationProfile";
import TelemetryProfile from "./steps/TelemetryProfile";

export default interface Profile {
    fileName: string,
    benchProfile: typeof BenchProfile,
    preparationProfile: typeof PreparationProfile | undefined,
    telemetryProfile: typeof TelemetryProfile | undefined,
    configSchema: any,
}
