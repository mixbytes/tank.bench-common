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

test("Simple internal test", async cb => {
    process.argv = ["-b=SimpleBenchProfile"];
    await testBench(cb);
});

test("Simple common internal test", async cb => {
    process.argv = ["-n=SimpleBenchProfile"];
    await testBench(cb);
});

test("Simple external test", async cb => {
    process.argv = ["-b=./test/simple/testCase/SimpleBenchProfileExt.js"];
    await testBench(cb);
});


