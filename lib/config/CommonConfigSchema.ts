export default {
    log: {
        keyPoints: {
            arg: 'common.log.keyPoints',
            format: "int",
            default: null,
            doc: "log every N processed transactions. -1 to disable log"
        },
        logLevel: {
            arg: 'common.log.logLevel',
            format: "int",
            default: null,
            doc: "the level of the log. 0 - only errors, 3 - full log"
        },
    },
    stopOn: {
        error: {
            arg: 'common.stopOn.error',
            format: ["stop", "print", "no"],
            default: null,
            doc: "weather to stop benchmark on blockchain errors or not. Available values - (\"block\", \"fetch\", \"no\")"
        },
        processedTransactions: {
            arg: 'common.stopOn.processedTransactions',
            format: "int",
            default: null,
            doc: "Stop if achieved this amount of transactions. WARNING: some additional transactions may be processed."
        }
    },
    tps: {
        arg: 'common.tps',
        format: Number,
        default: null,
        doc: "desired transactions per second"
    },
    threadsAmount: {
        arg: 'common.threadsAmount',
        format: "int",
        default: null,
        doc: "amount of threads to perform transfer transactions"
    },
    maxActivePromises: {
        arg: 'common.maxActivePromises',
        format: "int",
        default: null,
        doc: "amount of threads to perform transfer transactions"
    },
    promisesStartDelay: {
        arg: 'common.promisesStartDelay',
        format: "int",
        default: null,
        doc: "time to wait before starting new promise. Used to get smoother performance."
    },
    localTpsMeasureTime: {
        arg: 'common.localTpsMeasureTime',
        format: Number,
        default: null,
        doc: "time used to measure local tps"
    }
};
