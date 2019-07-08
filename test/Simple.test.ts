import SimpleModule from "./simple/SimpleModule";

test("Simple internal test", async cb => {
    process.argv = ["-p=SimpleBenchProfile"];
    jest.setTimeout(99999999);
    await new SimpleModule().bench();
    cb();
});


test("Simple external test", async cb => {
    process.argv = ["-p=./test/simple/testCase/SimpleBenchProfileExt.js"];
    jest.setTimeout(99999999);
    await new SimpleModule().bench();
    cb();
});
