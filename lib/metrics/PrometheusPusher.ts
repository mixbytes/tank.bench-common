import {ClientRequestArgs} from "http";
import {Counter, Gauge, Histogram, Pushgateway} from "prom-client";

const client = require("prom-client");

const PUSHES_INTERVAL = 500;

export default class PrometheusPusher {
    private readonly commonConfig: any;
    private readonly pushGateway: Pushgateway;

    private readonly trxs: Counter;
    private readonly avgTps: Gauge;
    private readonly responseCodes: Histogram;
    private readonly trxsDurations: Histogram;

    constructor(commonConfig: any) {
        this.commonConfig = commonConfig;
        const config = this.commonConfig.prometheusTelemetry;

        this.trxs = new client.Counter({
            name: 'total_transactions',
            help: 'Total amount of transactions pushed to blockchain nodes.'
        });
        this.avgTps = new client.Gauge({
            name: 'avg_tps',
            help: 'Average speed of benchmark in transactions per second.'
        });
        this.responseCodes = new client.Histogram({
            name: 'response_codes',
            help: 'Histogram of response codes from node.',
            buckets: config.respCodeBuckets
        });
        this.trxsDurations = new client.Histogram({
            name: 'trxs_durations',
            help: 'Histogram that shows durations of transactions.',
            buckets: config.trxsDurationBuckets
        });

        const auth = config.user !== "" ?
            `${config.user}:${config.password}`
            : undefined;

        const headers: ClientRequestArgs = {auth: auth};

        this.pushGateway = new client.Pushgateway(config.url, headers);
    }

    async test() {
        await new Promise((resolve, reject) => {
            this.pushGateway.push({jobName: 'bench-load'}, (_, httpResponse) => {
                // 202 is a success code of pushgateway
                if (httpResponse.statusCode !== 202)
                    reject(new Error(`Prometheus error, ${httpResponse.statusCode}, ${httpResponse.statusMessage}`));
                else
                    resolve();
            });
        });
    }

    start() {
        setInterval(() => {
            this.forcePush();
        }, PUSHES_INTERVAL);
    }

    forcePush() {
        this.pushGateway.push({jobName: 'bench-load'}, () => {
        });
    }

    addProcessedTransactions(trxs: number) {
        this.trxs.inc(trxs);
    }

    setAvgTps(tps: number) {
        this.avgTps.set(tps);
    }

    addTrxDuration(duration: number) {
        this.trxsDurations.observe(duration);
    }

    addResponseCode(code: number) {
        this.responseCodes.observe(code);
    }
}
