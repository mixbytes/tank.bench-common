# tank.bench-common

[![npm version](https://badge.fury.io/js/tank.bench-common.svg)](https://www.npmjs.com/package/tank.bench-common)

This is a part of [TANK](https://github.com/mixbytes/tank) - the ultimate tool for testing blockchain performance

## What is it?

**Tank.bench-common** is the repo that contains code that applies load to blockchain nodes.

It can prepare your blockchain for benchmark (create accounts, deploy tokens, etc.) and start applying load with
specified tps (transactions per second), providing telemetry (using push-model). You also can specify such params as 
threads amount (applies load using node's **worker_threads**).

## Requirements

To use this package you need at least **node v12.5** because of using **worker-threads** feature to run the benchmark
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

In `getConfigSchema` method you should return schema of your configuration
(using [node-convict](https://github.com/mozilla/node-convict) schema), so the configuration file of your module will
be checked if it corresponds to this schema, otherwise the programm will throw error and stop.

Implementing `getDefaultConfigFilePath` is optional; if you do it, you should return the default path to your module
configuration file.


```typescript
import {BlockchainModule, BuiltinProfile, PreparationProfile, Telemerty} from "tank.bench-common"

export default class SimpleModule extends BlockchainModule {
    getBuiltinProfiles(): BuiltinProfile[] {
        return [
            {
                benchFile: DefaultBenchProfile.fileName,
                preparationFile: DefaultPreparationProfile.fileName,
                telemetryFile: null,
                name: "default"
            },

            {
                benchFile: SuperBenchProfile.fileName,
                preparationFile: null,
                telemetryFile: DefaultTelemetryProfile.fileName,
                name: "SuperProfile"
            },
        ]
    }

    getConfigSchema(): any {
        return {
            hello: {
                type: "String",
                default: name
            }
        }
    }

    getDefaultConfigFilePath(): string | null {
        return "supermodule.bench.config.json";
    }
}
```

### What is profile?

Profile is a set of files, containing one class in each other. There are 3 parts of a profile - **preparation**,
**telemetry** and **bench (required)**. Other parts are optional.

Profile specifies the code that will be run on concrete time and thread.

Every class that is part of profile provide `asyncConstruct` method to implement. No methods will be called in
your implementation before the promise you returned become resolved. This may be useful.


#### Preparation

The main goal of the **Preparation** part is to commit preparation transactions like accounts creation. Do this job in the
`prepare` method, returning **Promise**. The object returned from this promise will be used as config for the next step,
the **BenchProfile**

#### Telemetry

**Telemetry** part contains code that will be called in some specific keypoint during benchmark. Every method takes 
`telemetryData`. It is the structure containing information such as TPS and some other data.

`onKeyPoint` method will be called when committed every N (N is gotten from **commonConfig**).

`onBenchEnded` method will be called when the benchmark is ended successfully.

This part can be used if you want to have your own telemetry (not using built-in **prometheus** one), or just to do
logging stuff.

### Bench

`Bench` is a class that describes what load transactions to commit. 
It provides `commitTransaction` method, in which you
can commit transactions. Important part of this step that it will be instantiated as many times as provided in config
via **threadsAmount** parameter, each in it's own **worker_thread**. Also, you need too remember
that the `commitTransaction` method can be called using multiple promises (subsequently).

You should return Promise from `commitTransaction` method, and transaction will be counted as processed
when you resolve this promise.
In this promise you have to specify **responseCode** and **error (may be null)** to use telemetry correctly.

### Builtin profiles

The main goal of profiles is to be passed to benchmark via cli arguments to use this on special servers.
But you can specify the builtin profiles that will be used if no profile parts files art provided as arguments.
If you don't specify any cli argument for profile path, the builtin profile named **default** will be used (if such
exists).

### External profiles

If the profile is used as external js files, you can specify them as cli arguments.
So when you start bench like this: 

```bash
npm start -- -p="./MyGreatProfile"
```

It means, that it has to use preparation part from "MyGreatProfile.js" file, default bench part and default telemetry part.

Here is the list of flags:

* **-p=** flag is used to specify **preparation** part
* **-b=** flag is used to specify **bench** part
* **-t=** flag is used to specify **telemetry** part
* **-n=** flag is used to specify all parts if using builtin profile. So you provide the name of profile after "=" sign.

### How to run?

After you implemented all required interfaces, to run the bench, just do the following thing:

```typescript
new MyModule().bench().then(e => console.log(e));
```

Note that you must specify at least one command line argument - the name of `BenchProfile` implementation file.
Like this:

```bash
npm start -- -b="./MyGreatBenchProfile"
```

It will start benchmark, starting with `PreparationProfile`. If any error occurred, it will stop and log the error.

### Configuration

The implementation of **tank.bench-common** uses **2** different configuration files - one is for
common code part, and the other - for blockchain-specific code part. The common one is specified by 
this code repository, other one is configurable by overriding `getConfigSchema` method in **BlockchainModule** class.

So, starting this app you should have 2 configuration files - containing two configs.
By default, configuration of common code is being taken from **bench.config.json** file, and
module config from **module.bench.config.json**. You can override this logic in your `BlockchainModule` class.

Also you can provide arguments to the programm overriding default paths of configuration. The are **--commonconfig** 
and **--moduleconfig** (and their short versions, **-cc** and **-mc**).

For example, `npm start -- -b="./MyGreatBenchProfile" -mc=mymodule.json` will get module config from `mymodule.json` file.

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
    * **url** - the url of prometheus **push-gateway** where telemetry should be pushed.
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

* Cannot find module 'worker_threads'
  
  To fix this problem you should switch to using at least **node v12.5**
