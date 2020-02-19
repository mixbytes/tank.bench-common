#!/usr/bin/env node

import {register} from "ts-node";
import {getProfileTSConfig} from "./tools/Tools";

register({project: getProfileTSConfig()});

require("./bench");
