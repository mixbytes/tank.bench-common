# tank.bench-common

[![npm version](https://badge.fury.io/js/tank.bench-common.svg)](https://www.npmjs.com/package/tank.bench-common)

Bench load applier common module for any blockchain.

This is an util for becnhmarking blockchain transactions performance.


### How to use?

This is library, that provides some interfaces you need to implement. So, the main thing you should do in your module 
is to create class that implements `BlockchainModule` interface.

```typescript
export default class MyModule implements BlockchainModule {
    createBenchStep(config: any, logger: Logger): BenchStep {
        ...
    }

    createPrepareStep(config: any, logger: Logger): PrepareStep {
        ...
    }

    getFileName(): string {
        return __filename;
    }
}

```

You need to provide fileName of your module, because wokrer-thread will use it, so it needs this fileName to require
your module.

Also, you need to create classes that provide `BenchStep` and `PrepareStep` implementations. Steps contain
blockchain-specific code. They both provide `asyncConstruct` method to implement. No methods will be called in
your implementation before the promise you returned become resolved. 

The main goal of the `PrepareStep` is to commit preparation transactions like accounts creation. Do this job in
`prepare` method. The object returned from this promise will be used as config for the next step, the `BenchStep`

`BenchStep` is used to commit load transactions. It provides `commitBenchmarkTransaction` method, in which you
can commit transactions. More than one promise returned from it can work simultaneously.


After you implemented all required interfaces, to run the bench, just do the following thing:

```typescript
new BenchRunner(new MyModule()).bench();
```

It will log the end of benching automatically.

