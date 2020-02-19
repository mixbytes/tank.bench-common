import {bench} from "./worker/WorkersSpectator";

bench().then(() => {
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(-1);
});
