import {CommonConfig, TelemetryData} from "tank.bench-profile";
import ProfileConfig from "../config/ProfileConfig";
import Logger from "../resources/Logger";
import {Strings} from "../resources/Strings";
import PrometheusPusher from "../metrics/PrometheusPusher";
import {WorkerWrapper} from "./WorkerWrapper";
import {importProfile} from "../tools/Tools";


const LOGGER_INTERVAL = 500;
const LAST_TRXS_AMOUNT_FOR_LOCAL_TPS = 20;
const BENCH_INFO_SCRAPPER_INTERVAL = 100;


function generateSharedBuffers(commonConfig: CommonConfig) {
    const sharedTransProcessedBuffer =
        new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * commonConfig.threadsAmount);
    const sharedTransProcessedArray = new Uint32Array(sharedTransProcessedBuffer).fill(0);


    return {
        sharedTransProcessedArray,
        sharedTransProcessedBuffer
    };
}


export async function bench(profileFilePath: string) {
    const profile = await importProfile(profileFilePath);

    const {commonConfig, moduleConfig} = ProfileConfig.from(profile);
    const {prepare, telemetry} = profile;
    const logger = new Logger(commonConfig);


    // Prepare prometheus
    let prometheusPusher: PrometheusPusher | undefined = undefined;
    if (commonConfig.prometheusTelemetry.enable) {
        logger.log(Strings.log.preparingTelemetry());
        prometheusPusher = new PrometheusPusher(commonConfig);
        await prometheusPusher.test();
        logger.log(Strings.log.preparingTelemetrySuccess());
    }


    // Call the prepare step
    const benchConfig = await prepare({commonConfig, moduleConfig});


    // Construct telemetry
    let telemetryConfig: any = undefined;
    if (telemetry) {
        telemetryConfig = await telemetry.constructTelemetry({commonConfig, moduleConfig});
    }


    // Generate shared buffers
    const buffers = generateSharedBuffers(commonConfig);


    // Create workers
    const workers: WorkerWrapper[] = [];
    for (let i = 0; i < commonConfig.threadsAmount; i++) {
        try {
            const worker = await WorkerWrapper.create(
                i,
                profileFilePath,
                buffers.sharedTransProcessedBuffer,
                commonConfig,
                benchConfig
            );

            workers.push(worker);
        } catch (e) {
            // Error while creating [i] worker
            for (let j = 0; j < workers.length; j++) {
                await workers[j].terminate();
            }
            throw e;
        }
    }


    // Prepare workers
    try {
        await Promise.all(workers.map((worker) => {
            return worker.prepare();
        }));
    } catch (e) {
        // error while preparation in any worker
        for (let j = 0; j < workers.length; j++) {
            await workers[j].terminate();
        }
        throw e;
    }

    // Create information about benchmark
    const benchData = {
        processedTransactions: 0,
        benchStartTime: 0,
        avgTps: 0,
        localTps: 0,
        trxsEndTimes: new Array(LAST_TRXS_AMOUNT_FOR_LOCAL_TPS).fill(0)
    };
    const timers: NodeJS.Timeout[] = [];


    // Start bench info scrapper
    timers.push(setInterval(() => {
        // Calculate average tps
        if (benchData.benchStartTime === 0)
            benchData.avgTps = 0;
        else
            benchData.avgTps = benchData.processedTransactions / (new Date().getTime() - benchData.benchStartTime) * 1000.0;

        // Calculate local tps
        benchData.localTps = Math.min(LAST_TRXS_AMOUNT_FOR_LOCAL_TPS, benchData.processedTransactions)
            / (new Date().getTime() - benchData.trxsEndTimes[0]) * 1000;

    }, BENCH_INFO_SCRAPPER_INTERVAL));


    // Start telemetry update loop
    if (telemetry)
        timers.push(setInterval(() => {
            if (benchData.benchStartTime === 0)
                return;
            const telemetryData: TelemetryData<any> = {
                telemetryConfig: telemetryConfig,
                avgTps: benchData.avgTps,
                lastLocalTps: benchData.localTps,
                processedTransactions: benchData.processedTransactions,
                benchTime: new Date().getTime() - benchData.benchStartTime,
                processedTransactionsPerThread: Array.from(buffers.sharedTransProcessedArray)
            };
            telemetry!.onKeyPoint(telemetryData);
        }, commonConfig.telemetryStepInterval));


    // Start prometheus pusher loop
    if (prometheusPusher)
        prometheusPusher.start();


    // Start logger loop
    timers.push(setInterval(() => {
        console.log(`processed: ${benchData.processedTransactions}`);
        console.log(`local tps: ${benchData.localTps}`);
        console.log(`avg   tps: ${benchData.avgTps}`);
        console.log("");
    }, LOGGER_INTERVAL));


    // Start bench on workers
    benchData.benchStartTime = new Date().getTime();
    try {
        await Promise.all(workers.map((worker) => {
            return worker.bench((threadId, respCode, trDuration) => {
                benchData.processedTransactions++;

                // Update trxsEndTimes array to calculate local tps in bench info scrapper loop
                benchData.trxsEndTimes.shift();
                benchData.trxsEndTimes[LAST_TRXS_AMOUNT_FOR_LOCAL_TPS - 1] = new Date().getTime();


                if (prometheusPusher) {
                    prometheusPusher.addProcessedTransactions(1);
                    prometheusPusher.addResponseCode(respCode);
                    prometheusPusher.addTrxDuration(trDuration);
                    prometheusPusher.setAvgTps(benchData.avgTps);
                }
            });
        }));
        for (let j = 0; j < workers.length; j++) {
            await workers[j].terminate();
        }
    } catch (e) {
        // error while preparation in any worker
        for (let j = 0; j < workers.length; j++) {
            await workers[j].terminate();
        }
        timers.forEach(timer => {
            clearInterval(timer);
        });
        throw e;
    }

    timers.forEach(timer => {
        clearInterval(timer);
    });

    if (telemetry) {
        const telemetryData: TelemetryData<any> = {
            telemetryConfig: telemetryConfig,
            avgTps: benchData.avgTps,
            lastLocalTps: benchData.localTps,
            processedTransactions: benchData.processedTransactions,
            benchTime: new Date().getTime() - benchData.benchStartTime,
            processedTransactionsPerThread: Array.from(buffers.sharedTransProcessedArray)
        };
        await telemetry!.onBenchEnded(telemetryData);
    }


    // Final log
    console.log(`Total processed: ${benchData.processedTransactions}`);
    console.log(`Local tps: ${benchData.localTps}`);
    console.log(`Avg   tps: ${benchData.avgTps}`);
    console.log("");
}
