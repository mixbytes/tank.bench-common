export default {
    logLevel: {
        arg: 'common.log.level',
        format: "int",
        default: null,
        doc: "the level of the log. 0 - only errors, 3 - full log"
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
    prometheusTelemetry: {
        enable: {
            arg: 'prometheusTelemetry.enable',
            format: Boolean,
            default: null,
            doc: "weather to send telemetry to promethus gateway or not"
        },
        url: {
            arg: 'prometheusTelemetry.url',
            format: String,
            default: null,
            doc: "url of prometheus pushgateway"
        },
        user: {
            arg: 'prometheusTelemetry.user',
            format: String,
            default: null,
            doc: "user of prometheus pushgateway. If do not want to use auth, leave blank"
        },
        password: {
            arg: 'prometheusTelemetry.password',
            format: String,
            default: null,
            sensitive: true,
            doc: "password of prometheus pushgateway. If do not want to use auth, leave blank"
        },
        respCodeBuckets: {
            arg: 'prometheusTelemetry.respCodeBuckets',
            format: Array,
            default: null,
            doc: "possible return codes from node"
        },
        trxsDurationBuckets: {
            arg: 'prometheusTelemetry.trxsDurationBuckets',
            format: Array,
            default: null,
            doc: "buckets for possible transaction durations"
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
    }
};
