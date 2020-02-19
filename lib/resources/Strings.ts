export const Strings = {
    log: {

        preparingTelemetry: () =>
            `Checking prometheus pushgateway endpoint...`,

        preparingTelemetrySuccess: () =>
            `Checking prometheus pushgateway endpoint success!`,

    },

    constants: {
        debugArg: () => "--debug",

        commonConfigFilePathArgs: () =>
            ["-cc", "--common-config", "testcc"],

        moduleConfigFilePathArgs: () =>
            ["-mc", "--module-config", "--profile-config", "testmc"],

        benchProfileFilePathArgs: () =>
            ["-case", "-p", "--profile"],

        commonConfigFilePath: () =>
            `./bench.config.json`,

        moduleConfigFilePath: () =>
            `./module.config.json`

    }
};
