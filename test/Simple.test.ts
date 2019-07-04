import SimpleModule from "./simple/SimpleModule";

test("Simple test", async cb => {
    process.argv = ["-case=./test/simple/testCase/SimpleBenchCase.js"];
    jest.setTimeout(99999999);
    await new SimpleModule().bench().catch(e => {
        console.error(e);
    });
    cb();
});
