import {BenchTelemetryStep, TelemetryData} from "../../lib";

export default class SimpleModuleBenchTelemetryStep extends BenchTelemetryStep {
    async onBenchEnded(d: TelemetryData): Promise<any> {
        console.log(d);
        return Promise.resolve();
    }

    onKeyPoint(d: TelemetryData): any {
        console.log(d)
    }
}
