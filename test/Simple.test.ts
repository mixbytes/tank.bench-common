import {spawn} from "child_process";


const asyncExec = (command: string, args: string[]) => new Promise<number>((resolve, reject) => {
    const argv = [...args, "testmc", "config/module.config.json", "testcc", "config/bench.config.json"];
    const ls = spawn(command, argv);

    ls.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    ls.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    ls.on('close', (code) => {
        if (code === 0)
            resolve(code);
        else
            reject(code);
    });
});


const testBench = async (argv: string[]) => {
    // 20 secs
    jest.setTimeout(20_000);
    process.argv = argv;

    await asyncExec("npm", ["run", "start", ...argv]);
};


describe("Profiles", () => {
    it("Example profile (project/dir)", async () => {
        await testBench(["test/profiles/example"]);
    });
    it("Example profile (project/file)", async () => {
        await testBench(["test/profiles/example/Example.ts"]);
    });
    it("Example profile (compiled)", async () => {
        await testBench(["test/profiles/example/dist/profile.js"]);
    });
});
