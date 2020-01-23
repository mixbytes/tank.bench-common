# Tank.bench-common

[![npm version](https://badge.fury.io/js/tank.bench-common.svg)](https://www.npmjs.com/package/tank.bench-common)

This is a part of [MixBytes.Tank](https://github.com/mixbytes/tank) - 
the ultimate tool for testing blockchain performance

## What is it?

`Tank.bench-common` is used to apply load to blockchain nodes.

It provides developer-friendly interface to implement multithreaded
code using js/ts libraries which can be used to
test some blockchain nodes how they can handle highload.

It is used inside the [MixBytes.Tank](https://github.com/mixbytes/tank)
to apply load to deployed clusters.


## Requirements

To use this package you need at least `node v12.5` because
of using `worker-threads` feature to run the benchmark
using multiple CPUs. 


## How to use?

This project is designed to run `Tank.bench profiles`.
Compiled `Tank.bench profile` is a js file with integrated dependencies that can be created using
[tank.bench-profile-compiler](https://github.com/mixbytes/tank.bench-profile-compiler).
`Tank.bench profile` contains blockchain-specific code.

You can also run non-compiled profile using `Tank.bench profile`, so it will be compiled before 
execution.
 

## Example of usage

First, you need to install `tank.bench-common` using npm install command.

```shell script
npm install tank.bench-common
```

Once installed, you should create 2 configuration files - `bench.config.json` and `module.config.json`.
The first one specifies the behaviour of `Tank.bench-common`, and the second is used to configure
the profile passed it. You can read about them below.

After you created configuration files, you can use the `npx tank-bench`
command to run your `Tank.bench profile`.

```shell script
npx tank-bench profile.js
```

Or, if you want to run non-compiled profile, specify path to the folder containing it:

```shell script
npx tank-bench path-to-profile-folder
```

The tank-bench executable can take additional arguments.
You can read about them in [this](#command-line-arguments) section of this readme.


## Creating profiles

`Tank.bench profile`, before it gets compiled, is a node.js project,
written with typescrypt. As any node.js project, it contains
`package.json` file with all dependencies listed.

The `Tank.bench profile` consists of at least one typescript file. This file should export the Profile 
object. Profile object can be created using the special function, that takes an object with some amount of 
functions, that specify the behaviour of load applied to blockchain nodes.

You can find the boilerplate of profile [here](https://github.com/mixbytes/tank.bench-common/tree/master/test/profiles/Example.ts)

```typescript
export const profile = Profile({
    configSchema,
    prepare,
    constructBench,
    destroyBench,
    commitTransaction,
    telemetry: {
        constructTelemetry,
        onBenchEnded,
        onKeyPoint
    }
});

```


### configSchema
ConfigSchema is the configuration schema of your profile. The `module.config.json` file should respect that schema,
otherwise there will be an error. `Tank.bench-common` uses [node-convict](https://github.com/mozilla/node-convict)
to parse schema, configuration files and commandline arguments.

The configuration from file will be passed to the `prepare` function.


### prepare
This function is called once in the main thread. Here you can make some preparation transactions,
try your connection to the node, create network accounts etc.
Anything you return from this function will be cloned to benchmark threads via the
[structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)


### constructBench
This function is called once for every benchmark thread.
Here you can initialize your connection to the blockchain to commit transactions later.
Anything you return from this function will be passed to the commitTransaction function.
For example, you can return the blockchain connection object


### destroyBench
This function is called once for every benchmark thread.
after the last transaction is processed.
Here you can destroy your connection to the blockchain


### commitTransaction
This function is called multiple times for every benchmark thread.
Here you may send the transaction to the blockchain network.
You should return the TransactionResult for the prometheus telemetry to run fine
The uniqueData argument contains string that is unique among other threads and this function calls


### Telemetry
`Tank.bench-common` is able to push it's own telemetry to prometheus.
But if you want, you can implement your own telemetry module.


To do this, you should create 3 functions - one will be called when the telemetry
is going to be constructed, one - when destroyed and one will be called every N seconds
(specified via common config).


## Command line arguments

You should specify the profile to run using command line arguments. The profile should be the first argument or
follow the `-p` flag. For example,

```shell script
npx tank-bench -p profile.js
```

Also you can provide arguments to the program overriding default paths of configuration. The are `--commonconfig` 
and `--moduleconfig` (and their short versions, `-cc` and `-mc`) if you do not want to use the `bench.config.json`
or `module.config.json` files.

```shell script
npx tank-bench -p profile.js -mc mymodule.json
```

In this case the config for the profile will be gotten from the `mymodule.json` file.

Also using the command line arguments you can override any arguments listed in configuration schema of profile
or any argument of commonConfig.

```shell script
npx tank-bench profile.js -common.tps 100
```

In this case the tps value will be overridden with the value of 100.

### Common code configuration

Here is the list of available configuration parameters of `Tank.bench-common`:

* `logLevel` - the level of log. Can be 0,1,2,3. 0 - don't log anything, 3 - provide debug log.
* `stopOn` - this section specifies the conditions when to stop benchmark.
    * `error` - `works only in blockchain step!` Can be "no", "stop" or "print".
     If "no", all errors will be ignored. If stop, benchmark will be stopped with error.
     If "print", the error will be logged and benchmark will go on.
    * `processedTransactions` - Stop if reach specified amount of processed transactions. Not very 
     accurate, can process some more transactions than specified. If you don't want to use
     stop on specified amount, provide `-1` as value.
* `prometheusTelemetry` - this section specifies configuration of built-in prometheus telemetry.
    * `enable` - if the telemetry is enabled. All other fields in this section are optional if this is set to `false`.
    * `url` - the url of prometheus `push-gateway` where telemetry should be pushed.
    * `user` - the login of push-gateway user. Optional.
    * `password` - the password of push-gateway user. Optional.
    * `respCodeBuckets` - the buckets for transactions responseCodes histogram.
    * `trxsDurationBuckets` - the buckets for transaction durations histogram.
* `telemetryStepInterval` - the `TelemetryStep` `onKeyPoint` method will be calles every N milliseconds.
* `tps` - specify the desired transactions per second value.
* `threadsAmount` - specify the amount of `worker_threads` to use during benchmark.
* `maxActivePromises` - specify the maximum amount of promises to use in one `worker_thread` during benchmark.

All fields are required, if otherwise not written.


## Troubleshooting

* Cannot find module 'worker_threads'
  
  To fix this problem you should switch to using at least `node v12.5`
