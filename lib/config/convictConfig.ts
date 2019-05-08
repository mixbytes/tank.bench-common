const convict = require("convict");

export default new convict(
    {
        log: {
            logLevel: {
                arg: 'log.logLevel',
                format: "int",
                default: 3,
                doc: "the level of the log. 0 - only errors, 3 - full log"
            },
            printErrorStack: {
                arg: 'log.printErrorStack',
                format: Boolean,
                default: true,
                doc: "whether to print error stack or no"
            },
        },
        stopOn: {
            error: {
                arg: 'stopOn.error',
                format: ["stop", "print", "no"],
                default: "stop",
                doc: "weather to stop benchmark on blockchain errors or not. Available values - (\"block\", \"fetch\", \"no\")"
            },
            processedTransactions: {
                arg: 'stopOn.processedTransactions',
                format: "int",
                default: 1000000,
                doc: "Stop if achieved this amount of transactions. WARNING: some additional transactions may be processed."
            }
        },
        threadsAmount: {
            arg: 'threadsAmount',
            format: "int",
            default: 8,
            doc: "amount of threads to perform transfer transactions"
        },
        maxActivePromises: {
            arg: 'maxActivePromises',
            format: "int",
            default: 10,
            doc: "amount of threads to perform transfer transactions"
        },
        configFile: {
            arg: 'configFile',
            format: String,
            default: "./bench.config.json",
            doc: "Path to config file"
        }
    }
);
