# tank.bench-common

[![npm version](https://badge.fury.io/js/tank.bench-common.svg)](https://www.npmjs.com/package/tank.bench-common)

This is a part of [TANK](https://github.com/mixbytes/tank) - the ultimate tool for testing blockchain performance

## What is it?

**Tank.bench-common** is the repo that contains code that applies load to blockchain nodes.

It can prepare your blockchain for benchmark (create accounts, deploy tokens, etc.) and start applying load with
specified tps (transactions per second), providing telemetry (using push-model). You also can specify such params as 
threads amount (applies load using node's **worker_threads**).

## Requirements

To use this package you need at least **node v11** because of using **worker-threads** feature to run the benchmark
using multiple CPUs. 

## How to install?

This repo is a library, so you can use it as dependency of your blockchain implementation.
You can use npm or yarn to install this package.

```bash
npm install tank.bench-common -S
```

## How to use?

You should use your own repo
to write blockchain-specific code (for example, see [Haya implementation](https://github.com/mixbytes/tank.bench-haya) 
or [PolkaDot implementation](https://github.com/mixbytes/tank.bench-polkadot)

So, the first thing you should do in your module is to create class that extends `BlockchainModule` class.

It contains methods you should define. In the methods that start with `create` prefix you should instantiate "steps" - 
overridden classes, that contain your specific code that will be called in specified moments of time.

In `getConfigSchema` method you should return schema of your configuration
(using [node-convict](https://github.com/mozilla/node-convict) schema), so the configuration file of your module will
be checked if it corresponds to this schema, otherwise the programm will throw error and stop.

In `getFileName` you have to provide path to your module, because **worker-threads** will use it, so it needs this 
fileName to require your module correctly.

Implementing `getDefaultConfigFilePath` is optional; if you do it, you should return the default path to your module
configuration file.


```typescript
import {BlockchainModule, Logger, BenchStep, PrepareStep, BenchTelemetryStep} from "tank.bench-common"

export default class MyModule extends BlockchainModule {
    createBenchStep(benchConfig: any, logger: Logger): BenchStep {
        return new MyModuleBenchStep(benchConfig, logger);
    }

    createPrepareStep(commonConfig: any, moduleConfig: any, logger: Logger): PrepareStep {
        return new MyModulePrepareStep(commonConfig, moduleConfig, logger);
    }

    createBenchTelemetryStep(benchConfig: any, logger: Logger): BenchTelemetryStep {
        return new MyModuleBenchTelemeryStep(benchConfig, logger)
    }

    getConfigSchema(): any {
        return {
            myCustomUrl: {
                    arg: 'myModule.myCustomUrl',
                    format: String,
                    default: null,
                    doc: "URL for my blockchain endpoint"
                },
        };
    }

    getDefaultConfigFilePath(): string | null {
        return "./myModule.bench.config.json"
    }

    // Used to make worker_threads work
    getFileName(): string {
        return __filename;
    }
}
```

### What are the steps?

Step is a class that contains some code that will run on specific time and thread. Every step is used for it's
own purpose.

#### PrepareStep

The main goal of the `PrepareStep` is to commit preparation transactions like accounts creation. Do this job in the
`prepare` method, returning **Promise**. The object returned from this promise will be used as config for the next step,
the **BenchStep**

#### BenchStep

`BenchStep` is used to commit load transactions. It provides `commitBenchmarkTransaction` method, in which you
can commit transactions. Important part of this step that it will be instantiated as many times as provided in config
via **threadsAmount** parameter, each in it's own **worker_thread**. Also, you need too remember
that the `commitBenchmarkTransaction` method can be called using multiple promises.

You should return Promise from `commitBenchmarkTransaction` method, and transaction will be counted as processed
when you resolve this promise. In this promise you have to specify **responseCode** or **error** to use telemetry correctly.

Both `PrepareStep` and `BenchStep` provide `asyncConstruct` method to implement. No methods will be called in
your implementation before the promise you returned become resolved. This may be useful.

#### TelemetryStep

`TelemetryStep` contains code that will be called in some specific keypoint during benchmark. Every method takes 
**telemetryData**. It is the structure containing information such as TPS and some other data.

`onKeyPoint` method will be called when committed every N (N is gotten from **commonConfig**)

`onBenchEnded` method will be called when the benchmark is ended succesfully.

This step can be used if you want to have your own telemetry (not using built-in **prometheus** one), or just to do
logging stuff.

### How to run?

After you implemented all required interfaces, to run the bench, just do the following thing:

```typescript
new BenchRunner(new MyModule()).bench().then(e => console.log(e));
```

It will start benchmark, starting with `PrepareStep`. If any error occured, it will stop and log the error.

### Configuration

The implementation of **tank.bench-common** uses **2** different configuration files - one is for
common code part, and the other - for blockchain-specific code part. The common one is specified by 
this code repository, other one is configurable by overriding `getConfigSchema` method in **BlockchainModule** class.

So, starting this app you should have 2 configuration files - containing two configs.
By default, configuration of common code is being taken from **bench.config.json** file, and
module config from **module.bench.config.json**. You can override this logic in your `BlockchainModule` class.

Also you can provide arguments to the programm overriding default paths of configuration. The are **--commonconfig** 
and **--moduleconfig** (and their short versions, **-cc** and **-mc**).

For example, `npm start -- -mc mymodule.json` will get module config from `mymodule.json` file.

#### Common code configuration

Here is the list of available configuration parameters:

* **logLevel** - the level of log. Can be 0,1,2,3. 0 - don't log anything, 3 - provide debug log.
* **stopOn** - this section specifies the conditions when to stop benchmark.
    * **error** - **works only in blockchain step!** Can be "no", "stop" or "print".
     If "no", all errors will be ignored. If stop, benchmark will be stopped with error.
     If "print", the error will be logged and benchmark will go on.
    * **processedTransactions** - Stop if reach specified amount of processed transactions. Not very 
     accurate, can process some more transactions than specified. If you don't want to use
     stop on specified amount, provide **-1** as value.
* **prometheusTelemetry** - this section specifies configuration of built-in prometheus telemetry.
    * **enable** - if the telemetry is enabled. All other fields in this section are optional if this is set to **false**.
    * **url** - the url of prometheus **push-gateway** where telemerty should be pushed.
    * **user** - the login of push-gateway user. Optional.
    * **password** - the password of push-gateway user. Optional.
    * **respCodeBuckets** - the buckets for transactions responseCodes histogram.
    * **trxsDurationBuckets** - the buckets for transaction durations histogram.
* **telemetryStepInterval** - the **TelemetryStep** `onKeyPoint` method will be calles every N milliseconds.
* **tps** - specify the desired transactions per second value.
* **threadsAmount** - specify the amount of **worker_threads** to use during benchmark.
* **maxActivePromises** - specify the maximum amount of promises to use in one **worker_thread** during benchmark.

All fields are required, if otherwise not written.


## Troubleshooting

* ####Cannot find module 'worker_threads'
    To fix this problem you should switch to using at least **node v11**
