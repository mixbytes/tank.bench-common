const ERROR = 0;
const WARN = 1;
const LOG = 2;

const _log = (config: any, level: number, msg: any) => {
    if (level <= config.logLevel) {
        switch (level) {
            case ERROR:
                console.error(`${msg}`);
                break;
            case WARN:
                console.warn(`${msg}`);
                break;
            default:
                console.log(`${msg}`);
        }
    }
};

export default class Logger {
    private readonly commonConfig: any;

    constructor(config: any) {
        this.commonConfig = config;
    }

    // noinspection JSUnusedGlobalSymbols
    error(msg: any): void {
        _log(this.commonConfig, ERROR, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    warn(msg: any): void {
        _log(this.commonConfig, WARN, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    log(msg: any, level = LOG): void {
        _log(this.commonConfig, level, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    logfull(msg: any): void {
        this.log(msg, LOG + 1);
    }
}
