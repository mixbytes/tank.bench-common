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

    error: {

        commonErrorMsg: (reason: any) =>
            `ERROR! The app can't run anymore. Reason:\n${reason}`,

        invalidConfigFile: () =>
            `Invalid configuration file:`,
    },

    constants: {
        workerFilePath: () =>
            `./node_modules/tank.bench-common/dist/worker/BenchWorker.js`
    }
};

export default Strings;
