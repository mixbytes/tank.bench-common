# Tank.bench-common  
[![npm version](https://badge.fury.io/js/tank.bench-common.svg)](https://www.npmjs.com/package/tank.bench-common)  

### Subprojects:
Tank.bench-profile [![npm version](https://badge.fury.io/js/tank.bench-profile.svg)](https://www.npmjs.com/package/tank.bench-profile) 

Tank.bench-profile-compiler [![npm version](https://badge.fury.io/js/tank.bench-profile-compiler.svg)](https://www.npmjs.com/package/tank.bench-profile-compiler)  
  
## What is it?  

`Tank.bench-common` is a part of [MixBytes.Tank](https://github.com/mixbytes/tank) -   
the ultimate tool for testing blockchain performance. 
  
The main application of this tool is to run [Tank.bench-profiles](https://github.com/mixbytes/tank.bench-profile) in multithreaded mode.

## Compatibility table
Warning! Tank.bench-common <5.1.0 is deprecated!

|Tank.bench-common|Tank.bench-profile|Tank.bench-profile-compiler|
|--|--|--|
|5.1.x|1.0.x|2.3.x|

  
  
## Requirements  
  
To use this package you need at least `node v12.5` because  
of using `worker-threads` feature to run the benchmark  
using multiple CPUs.   
  
  
## How to use?  
  
This project is designed to run [Tank.bench-profiles](https://github.com/mixbytes/tank.bench-profile).  
Follow the link to know more about profiles.

`Tank.bench-common` can run precompiled profiles (mostly used for production) or non-compiled using
[ts-node](https://github.com/TypeStrong/ts-node) (handy for the profile development).

Compiled profiles can be used to run benchmark on clusters deployed by [MixBytes.Tank](https://github.com/mixbytes/tank).
   
  
## Example of usage  

Note that this tool can be [used in docker](#running-in-docker)
  
First, you need to install `Tank.bench-common` using npm install command.  
  
```shell script  
npm install -S tank.bench-common
```  
  
Once installed, you should create 2 configuration files - `bench.config.json` and `module.config.json`.  
The first one specifies the behaviour of `Tank.bench-common`, and the second is used to configure  
the profile passed it. You can read about them below.  

After installation you will be able to use `npx tank-bench` command to run profiles.


### Running compiled profile
  
After you created configuration files, you can use the `npx tank-bench`  
command to run your compiled `Tank.bench-profile`.  
  
```shell script  
npx tank-bench profile.js
```  

### Running non-compiled profile
  
If you want to run non-compiled profile, specify path to the folder containing it:  
  
```shell script  
npx tank-bench path-to-profile-folder
```  
It can be handy for profile development.
  
## Running in docker

To run the bench in docker, use need to build the docker image

```shell script
docker build -t tank.bench-common:latest .
```

And then run, passing common config file, module config file and the profile.

```shell script
docker run -it --rm -v /your-path/tank.bench-common/config/:/config tank.bench-common:latest /config/profile.js -mc /config/module.config.json -cc /config/bench.config.json
```

## Command line arguments  
  
You should specify the profile to run using command line arguments. The profile should be the first argument or  
follow the `-p` flag. For example,  
  
```shell script  
npx tank-bench -p profile.js
```  
  
Also you can provide arguments to the program overriding default paths of configuration.
The are `--commonconfig` and `--moduleconfig` (and their short versions, `-cc` and `-mc`)
if you do not want to use the `bench.config.json` or `module.config.json` files.  
  
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
  
* `logLevel` - the level of log (deprecated). Can be 0,1,2,3. 0 - don't log anything, 3 - provide debug log.
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
