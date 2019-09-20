import BenchProfile from "./steps/BenchProfile";
import PreparationProfile from "./steps/PreparationProfile";
import TelemetryProfile from "./steps/TelemetryProfile";

export default interface Profile {
    benchProfile: typeof BenchProfile,
    preparationProfile?: typeof PreparationProfile | "takeFromBlockchainModuleDefaultProfile",
    telemetryProfile?: typeof TelemetryProfile | "takeFromBlockchainModuleDefaultProfile",
    configSchema?: any,
}
