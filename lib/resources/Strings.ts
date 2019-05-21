const Strings = {
    log: {

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

        commonConfigFilePath: () =>
            `./bench.config.json`,

        moduleConfigFilePath: () =>
            `./module.config.json`
    }
};

export default Strings;
