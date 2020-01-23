import {
    CommitTransactionArgs,
    ConstructBenchArgs,
    DestroyBenchArgs,
    PrepareArgs,
    Profile,
    TelemetryData,
    TransactionResult
} from "../../lib";


// Here is an example module configuration schema
// You can read the information on creating configuration schemas here:
// https://github.com/mozilla/node-convict
const configSchema = {
    url: {
        arg: 'profile.endpoint',
        format: String,
        default: "http://localhost:8080",
        doc: "Url of the node to connect to"
    },
};


const prepare = async (
    {commonConfig, moduleConfig}: PrepareArgs<typeof configSchema>) => {

    // This function is called once in the main thread. Here you can make some preparation transactions,
    // try your connection to the node, create network accounts etc.
    // Anything you return from this function will be cloned to benchmark threads via the structured clone algorithm
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm


};


const constructBench = async (
    {benchConfig, threadId}: ConstructBenchArgs<ReturnType<typeof prepare>>) => {

    // This function is called once for every benchmark thread.
    // Here you can initialize your connection to the blockchain to commit transactions later.
    // Anything you return from this function will be passed to the commitTransaction function.
    // For example, you can return the blockchain connection object

};

const destroyBench = async (
    {benchConfig, threadId, constructData}:
        DestroyBenchArgs<ReturnType<typeof prepare>, ReturnType<typeof constructBench>>) => {

    // This function is called once for every benchmark thread
    // after the last transaction is processed.
    // Here you can destroy your connection to the blockchain.

};

const commitTransaction = async (
    {benchConfig, constructData, threadId, uniqueData}:
        CommitTransactionArgs<ReturnType<typeof prepare>, ReturnType<typeof constructBench>>):
    Promise<TransactionResult> => {

    // This function is called multiple times for every benchmark thread.
    // Here you may send the transaction to the blockchain network.
    // You should return the TransactionResult for the prometheus telemetry to run fine
    // The uniqueData argument contains string that is unique among other threads and this function calls

    return {code: 0, error: null};
};


// Three functions below are used to provide custom telemetry. They are OPTIONAL, so if you do not want
// to use the telemetry, just leave the telemetry field of Profile argument undefined.
const constructTelemetry = async ({commonConfig, moduleConfig}: PrepareArgs<typeof configSchema>) => {

    // This function is used to construct the telemetry objects like connection to some server
    // Anything you return from this function will be passed to the onKeyPoint and onBenchEnded functions.

};
const onKeyPoint = ({avgTps, benchTime, lastLocalTps, processedTransactions, processedTransactionsPerThread, telemetryConfig}:
                        TelemetryData<ReturnType<typeof constructTelemetry>>) => {

    // This function is called every commonConfig.telemetryStepInterval milliseconds.
    // Here you can send data to your server
    // Don't perform long operations in this function

};
const onBenchEnded = async ({avgTps, benchTime, lastLocalTps, processedTransactions, processedTransactionsPerThread, telemetryConfig}:
                                TelemetryData<ReturnType<typeof constructTelemetry>>) => {

    // This function is used to destroy the connection to some telemetry server

};


export const profile = Profile({
    configSchema,
    prepare,
    destroyBench,
    constructBench,
    commitTransaction,
    telemetry: {
        constructTelemetry,
        onBenchEnded,
        onKeyPoint
    }
});
