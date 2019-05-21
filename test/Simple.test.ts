import {BenchRunner} from "../dist/lib";
import SimpleModule from "../dist/test/simple/SimpleModule";

test("Simple test", async cb => {
    jest.setTimeout(99999999);
    await new BenchRunner(new SimpleModule()).bench();
    cb();
});
