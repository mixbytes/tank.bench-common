#!/usr/bin/env node

import {prepareAndBench} from "./bench";

prepareAndBench().then(() => {
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(-1);
});





