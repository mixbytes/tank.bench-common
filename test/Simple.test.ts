import {prepareAndBench} from "../lib";

const testBench = async (argv: string[]) => {
    // 20 secs
    jest.setTimeout(20_000);
    process.argv = argv;

    await prepareAndBench();
};


describe("Profiles", () => {
    it("Example profile (project)", async () => {
        await testBench(["", "", "test/profiles/example"]);
    });
    it("Example profile (file)", async () => {
        await testBench(["", "", "test/profiles/example/dist/profile.js"]);
    });
});
