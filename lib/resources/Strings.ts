export const Strings = {
    log: {

        preparingTelemetry: () =>
            `Checking prometheus pushgateway endpoint...`,

        preparingTelemetrySuccess: () =>
            `Checking prometheus pushgateway endpoint success!`,

    },

    constants: {
        commonConfigFilePathArgs: () =>
            ["-cc", "--common-config"],

        moduleConfigFilePathArgs: () =>
            ["-mc", "--profile-config"],

        benchProfileFilePathArgs: () =>
            ["-case", "-p", "--profile"],

        commonConfigFilePath: () =>
            `./bench.config.json`,

        moduleConfigFilePath: () =>
            `./module.config.json`

    }
};
