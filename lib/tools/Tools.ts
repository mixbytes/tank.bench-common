import * as path from "path";
import {resolve} from "path";
import {AnyProfileType} from "tank.bench-profile";
import * as fs from "fs";
import {Strings} from "../resources/Strings";

export const processArg = (argVariants: string[]): string | null => {
    const args = process.argv;
    for (let i = 0; i < args.length; i++) {
        for (let j = 0; j < argVariants.length; j++) {
            if (args[i].startsWith(argVariants[j] + "="))
                return args[i].substr(argVariants[j].length + 2);
            if (args[i] === argVariants[j]) {
                if ((i + 1) < args.length)
                    return args[i + 1];
            }
        }
    }
    return null;
};

export const importProfile = async (filePath: string) => {
    let profileImport = await import(resolve(filePath));
    let profile: AnyProfileType;
    if (profileImport.default) {
        profile = <AnyProfileType>profileImport.default;
    } else if (profileImport.profile) {
        profile = <AnyProfileType>profileImport.profile;
    } else {
        profile = <AnyProfileType>profileImport;
    }
    return profile;
};

export function getProfileTSConfig() {
    const profileFile = getProfileFile();
    let tsConfig = path.resolve(profileFile.profileDir, "tsconfig.json");

    if (!fs.existsSync(tsConfig)) {
        tsConfig = path.resolve(__dirname, "../../../node_modules/tank.bench-profile-compiler/tsconfig.json");
    }

    return tsConfig;
}

export function getProfileFile() {
    const processedArg = processArg(Strings.constants.benchProfileFilePathArgs());

    const profilePath = processedArg ? processedArg : process.argv[2];

    if (!profilePath)
        throw new Error("You need to specify the profile (project or compiled one) as the first argument");

    let profileFullPath = path.resolve(profilePath);

    let profileIsDir = false;

    if (fs.lstatSync(profileFullPath).isDirectory()) {
        profileIsDir = true;

        const pack = require(path.resolve(profileFullPath, "package.json"));
        profileFullPath = path.resolve(profileFullPath, pack.main);
    }

    return {
        fullPath: profileFullPath,
        profileDir: path.dirname(profileFullPath),
        entryPoint: path.basename(profileFullPath),
        profileIsDir
    };
}
