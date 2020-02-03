import {bench} from "./worker/WorkersSpectator";
import {processArg} from "./tools/Tools";
import {Strings} from "./resources/Strings";
import * as path from "path";
import * as fs from "fs";

const compileProfile = require("tank.bench-profile-compiler");


export async function prepareAndBench() {
    // Legacy MixBytes.TANK support
    const processedArg = processArg(Strings.constants.benchProfileFilePathArgs());

    const profilePath = processedArg ? processedArg : process.argv[2];

    if (!profilePath)
        throw new Error("You need to specify the profile (project or compiled one) as the first argument");

    let profileFullPath = path.resolve(profilePath);

    if (fs.lstatSync(profileFullPath).isDirectory()) {
        console.log("The profile passed is a project, so it will be compiled first with tank.bench-profile-compiler");
        await compileProfile(profileFullPath);
        profileFullPath = profileFullPath + "/dist/profile.js";
    }

    return bench(profileFullPath);
}
