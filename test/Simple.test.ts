import SimpleModule from "./simple/SimpleModule";

const testBench = async (cb: jest.DoneCallback) => {
    jest.setTimeout(99999999);
    await new SimpleModule().bench(false);
    cb();
};

// test("Error internal test", async cb => {
//     process.argv = ["-p=error"];
//     await testBench(cb);
// });

test("Simple default internal test", async cb => {
    process.argv = [];
    await testBench(cb);
});

test("Simple common internal test", async cb => {
    process.argv = ["-p=SimpleBenchProfile"];
    await testBench(cb);
});

test("Simple internal test", async cb => {
    process.argv = ["-p=SimpleBenchProfile"];
    await testBench(cb);
});

test("Simple external test", async cb => {
    process.argv = ["-p=./test/simple/testCase/SimpleBenchProfileExt.js"];
    await testBench(cb);
});


