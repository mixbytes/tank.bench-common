export default interface BuiltinProfile {
    name: string,
    benchFile: string,
    preparationFile: string | null
    telemetryFile: string | null,
}
