import {prepareAndBench} from "../lib";

const testBench = async (argv: string[]) => {
    // 20 secs
    jest.setTimeout(20_000);
    process.argv = argv;

    await prepareAndBench();
};


describe("Profiles", () => {
    it("Example profile", async () => {
        await testBench(["", "", "dist/test/profiles/Example.js"]);
    });
});
