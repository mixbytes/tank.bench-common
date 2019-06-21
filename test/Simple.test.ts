import {BenchRunner} from "../lib/index"
import SimpleModule from "./simple/SimpleModule";

test("Simple test", async cb => {
    jest.setTimeout(99999999);
    await new BenchRunner(new SimpleModule()).bench();
    cb();
});
