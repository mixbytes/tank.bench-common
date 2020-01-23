import {resolve} from "path";
import {AnyProfileType} from "../profile/Profile";

export const processArg = (argVariants: string[]): string | null => {
    const args = process.argv;
    for (let i = 0; i < args.length; i++) {
        for (let j = 0; j < argVariants.length; j++) {
            if (args[i].startsWith(argVariants[j] + "="))
                return args[i].substr(argVariants[j].length);
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
