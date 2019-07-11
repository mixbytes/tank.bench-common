const Strings = {
    log: {

        preparingTelemetry: () =>
            `Checking prometheus pushgateway endpoint...`,

        preparingTelemetrySuccess: () =>
            `Checking prometheus pushgateway endpoint success!`,

        preparingToBenchmark: () =>
            `Preparing to benchmark...`,

        startingBenchmarkThreads: () =>
            `Preparation completed, starting benchmark threads...`,

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

        benchProfileFilePathArgs: () =>
            ["-b=", "--bench-profile="],

        preparationProfileFilePathArgs: () =>
            ["-p=", "--preparation-profile="],

        telemetryProfileFilePathArgs: () =>
            ["-t=", "--telemetry-profile="],

        commonProfileFilePathArgs: () =>
            ["-case=", "-n=", "--profile-name="],

        commonConfigFilePath: () =>
            `./bench.config.json`,

        moduleConfigFilePath: () =>
            `./module.config.json`

    }
};

export default Strings;
