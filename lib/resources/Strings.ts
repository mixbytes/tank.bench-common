const Strings = {
    log: {

        preparingTelemetry: () =>
            `Checking prometheus pushgateway endpoint...`,

        preparingTelemetrySuccess: () =>
            `Checking prometheus pushgateway endpoint success!`,

        preparingToBenchmark: () =>
            `Preparing to benchmark...`,

        startingBenchmark: (threads: number) =>
            `Starting benchmark (${threads} threads)...`,

        proceededNTransactions: (n: number) =>
            `Proceeded ${n} transations...`,

        benchmarkFinished: () =>
            `Benchmark finished!`
    },

    constants: {
        commonConfigFilePathArgs: () =>
            ["-cc=", "--common-config="],

        moduleConfigFilePathArgs: () =>
            ["-mc=", "--module-config="],

        benchCaseFilePathArgs: () =>
            ["-case=", "--bench-case="],

        commonConfigFilePath: () =>
            `./bench.config.json`,

        moduleConfigFilePath: () =>
            `./module.config.json`


    }
};

export default Strings;
