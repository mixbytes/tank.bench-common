import * as convict from "convict";
import {CommonConfig} from "../config/CommonConfigSchema";


export type PrepareArgs<ModuleConfig> = {
    commonConfig: CommonConfig,
    moduleConfig: ModuleConfig extends convict.Schema<infer R> ? R : ModuleConfig
}

export type ConstructBenchArgs<PrepareResult> = {
    threadId: number,
    benchConfig: UnPromisify<PrepareResult>
}

export type CommitTransactionArgs<PrepareResult, BenchConstructResult> = {
    uniqueData: string,
    threadId: number,
    benchConfig: UnPromisify<PrepareResult>,
    constructData: UnPromisify<BenchConstructResult>
}

export type DestroyBenchArgs<PrepareResult, BenchConstructResult> = {
    threadId: number,
    benchConfig: UnPromisify<PrepareResult>,
    constructData: UnPromisify<BenchConstructResult>
}

export type TelemetryData<TelemetryConstructResult> = {
    telemetryConfig: UnPromisify<TelemetryConstructResult>
    avgTps: number,
    lastLocalTps: number,
    processedTransactions: number,
    processedTransactionsPerThread: number[],
    benchTime: number,
}

export type TransactionResult = {
    code: number,
    error: any
}


export type ProfileType<ModuleConfig, PrepareResult = any, BenchConstructResult = any, TelemetryConstructResult = any> = {
    configSchema: convict.Schema<ModuleConfig>,
    prepare: ({commonConfig, moduleConfig}: PrepareArgs<ModuleConfig>) => Promise<PrepareResult>,
    constructBench: ({threadId, benchConfig}: ConstructBenchArgs<Promise<PrepareResult>>) => Promise<BenchConstructResult>,
    commitTransaction: ({uniqueData, threadId, benchConfig, constructData}: CommitTransactionArgs<Promise<PrepareResult>, Promise<BenchConstructResult>>) => Promise<TransactionResult>,
    destroyBench: (args: DestroyBenchArgs<Promise<PrepareResult>, Promise<BenchConstructResult>>) => Promise<any>,
    telemetry?: Telemetry<ModuleConfig, TelemetryConstructResult>
}

export type AnyProfileType = ProfileType<any, any, any>;

export type Telemetry<ModuleConfig, TelemetryConstructResult> = {
    constructTelemetry: ({commonConfig, moduleConfig}: PrepareArgs<ModuleConfig>) => Promise<TelemetryConstructResult>,
    onKeyPoint: (data: TelemetryData<Promise<TelemetryConstructResult>>) => any,
    onBenchEnded: (data: TelemetryData<Promise<TelemetryConstructResult>>) => Promise<any>,
}

type UnPromisify<T> = T extends Promise<infer R> ? R : T
type RetOrAny<T> = T extends (...args: any) => any ? ReturnType<T> : any;


export function Profile<ModuleConfig, PrepareResult, BenchConstructResult, TelemetryConstructResult>(
    {configSchema, prepare, constructBench, commitTransaction, telemetry, destroyBench}: ProfileType<ModuleConfig, PrepareResult, BenchConstructResult, TelemetryConstructResult>
) {
    let constructTelemetry: (({commonConfig, moduleConfig}: PrepareArgs<ModuleConfig>) => Promise<TelemetryConstructResult>) | undefined = undefined;
    if (telemetry) {
        constructTelemetry = telemetry.constructTelemetry;
    }

    return {
        configSchema,
        prepare,
        constructBench,
        commitTransaction,
        destroyBench,
        telemetry
    } as ProfileType<ModuleConfig, UnPromisify<RetOrAny<typeof prepare>>, UnPromisify<ReturnType<typeof constructBench>>, UnPromisify<RetOrAny<typeof constructTelemetry>>>;
}
