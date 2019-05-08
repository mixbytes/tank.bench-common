const ERROR = 0;
const WARN = 1;
const LOG = 2;

const _log = (config: any, level: number, msg: any) => {
    if (level <= config.log.logLevel) {
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
    private readonly config: any;

    constructor(config: any) {
        this.config = config;
    }

    // noinspection JSUnusedGlobalSymbols
    error(msg: any): void {
        _log(this.config, ERROR, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    warn(msg: any): void {
        _log(this.config, WARN, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    log(msg: any, level = LOG): void {
        _log(this.config, level, msg)
    }

    // noinspection JSUnusedGlobalSymbols
    logfull(msg: any): void {
        this.log(msg, LOG + 1);
    }
}
