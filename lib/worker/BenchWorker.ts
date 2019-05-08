import {isMainThread, parentPort, threadId, workerData} from "worker_threads";
import Logger from "../resources/Logger";
import BenchStep from "../module/steps/BenchStep";

const config = workerData.config;
const commonConfig = workerData.commonConfig;
const blockchainModuleFileName = workerData.filename;

let benchStep: BenchStep;
let benchRunning = false;
let transactionsStarted = 0;
let transactionsProcessed = 0;
let waitingPromises = 0;

const startBenchmark = () => {
    new Promise(resolve => {
        benchRunning = true;

        const addTransaction = () => {
            if (!benchRunning)
                return;
            let key = `${threadId}-${transactionsStarted}`;
            transactionsStarted++;
            waitingPromises++;
            benchStep.commitBenchmarkTransaction(key)
                .then(() => {
                    transactionsProcessed++;
                    waitingPromises--;
                    if (!benchRunning && waitingPromises === 0) {
                        resolve();
                    }
                    if (transactionsProcessed % 10 === 0) {
                        if (parentPort)
                            parentPort.postMessage({
                                method: "onKeyPoint",
                            });
                    }
                    if (benchRunning) {
                        setTimeout(addTransaction, 0);
                    }
                })
                .catch(e => {
                    waitingPromises--;
                    let err = null;
                    if (e) {
                        err = e.stack ? e.stack : e;
                    } else
                        err = "Undefined error";
                    switch (commonConfig.stopOn.error) {
                        case "print":
                            console.error(err);
                            if (benchRunning) {
                                setTimeout(addTransaction, 0);
                            }
                            break;
                        case "stop":
                            if (parentPort)
                                parentPort.postMessage({method: "onError", error: err});
                            break;
                    }
                    if (!benchRunning && waitingPromises === 0) {
                        resolve();
                    }
                });
        };
        for (let i = 0; i < commonConfig.maxActivePromises; i++) {
            addTransaction();
        }
    }).then(() => {
        if (!parentPort)
            return;
        parentPort.postMessage({
            method: "stopBenchmark",
        });
    });
};

const stopBenchmark = () => {
    benchRunning = false;
    if (waitingPromises === 0 && parentPort)
        parentPort.postMessage({
            method: "stopBenchmark",
        });
};

const run = () => {
    if (isMainThread)
        return;
    if (!parentPort)
        return;
    import(blockchainModuleFileName)
        .then(blockchainModule => {
            benchStep = new blockchainModule.default().createBenchStep(config, new Logger(config));
        })
        .then(() => benchStep.asyncConstruct())
        .then(() => {
            if (!parentPort)
                return;
            parentPort.postMessage({method: "startBenchmark"});
            startBenchmark();
        })
        .catch((e) => {
            if (!parentPort)
                return;
            parentPort.postMessage({method: "onError", error: e});
        });


    parentPort.on("message", msg => {
        if (msg.method === "stopBenchmark") {
            return stopBenchmark();
        } else {
            throw new Error("Unknown method");
        }
    });
};


run();
