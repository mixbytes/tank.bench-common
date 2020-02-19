(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define("profile", [], factory);
    else if (typeof exports === 'object')
        exports["profile"] = factory();
    else
        root["profile"] = factory();
})(global, function () {
    return /******/ (function (modules) { // webpackBootstrap
        /******/ 	// The module cache
        /******/
        var installedModules = {};
        /******/
        /******/ 	// The require function
        /******/
        function __webpack_require__(moduleId) {
            /******/
            /******/ 		// Check if module is in cache
            /******/
            if (installedModules[moduleId]) {
                /******/
                return installedModules[moduleId].exports;
                /******/
            }
            /******/ 		// Create a new module (and put it into the cache)
            /******/
            var module = installedModules[moduleId] = {
                /******/            i: moduleId,
                /******/            l: false,
                /******/            exports: {}
                /******/
            };
            /******/
            /******/ 		// Execute the module function
            /******/
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            /******/
            /******/ 		// Flag the module as loaded
            /******/
            module.l = true;
            /******/
            /******/ 		// Return the exports of the module
            /******/
            return module.exports;
            /******/
        }

        /******/
        /******/
        /******/ 	// expose the modules object (__webpack_modules__)
        /******/
        __webpack_require__.m = modules;
        /******/
        /******/ 	// expose the module cache
        /******/
        __webpack_require__.c = installedModules;
        /******/
        /******/ 	// define getter function for harmony exports
        /******/
        __webpack_require__.d = function (exports, name, getter) {
            /******/
            if (!__webpack_require__.o(exports, name)) {
                /******/
                Object.defineProperty(exports, name, {enumerable: true, get: getter});
                /******/
            }
            /******/
        };
        /******/
        /******/ 	// define __esModule on exports
        /******/
        __webpack_require__.r = function (exports) {
            /******/
            if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
                /******/
                Object.defineProperty(exports, Symbol.toStringTag, {value: 'Module'});
                /******/
            }
            /******/
            Object.defineProperty(exports, '__esModule', {value: true});
            /******/
        };
        /******/
        /******/ 	// create a fake namespace object
        /******/ 	// mode & 1: value is a module id, require it
        /******/ 	// mode & 2: merge all properties of value into the ns
        /******/ 	// mode & 4: return value when already ns object
        /******/ 	// mode & 8|1: behave like require
        /******/
        __webpack_require__.t = function (value, mode) {
            /******/
            if (mode & 1) value = __webpack_require__(value);
            /******/
            if (mode & 8) return value;
            /******/
            if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
            /******/
            var ns = Object.create(null);
            /******/
            __webpack_require__.r(ns);
            /******/
            Object.defineProperty(ns, 'default', {enumerable: true, value: value});
            /******/
            if (mode & 2 && typeof value != 'string') for (var key in value) __webpack_require__.d(ns, key, function (key) {
                return value[key];
            }.bind(null, key));
            /******/
            return ns;
            /******/
        };
        /******/
        /******/ 	// getDefaultExport function for compatibility with non-harmony modules
        /******/
        __webpack_require__.n = function (module) {
            /******/
            var getter = module && module.__esModule ?
                /******/            function getDefault() {
                    return module['default'];
                } :
                /******/            function getModuleExports() {
                    return module;
                };
            /******/
            __webpack_require__.d(getter, 'a', getter);
            /******/
            return getter;
            /******/
        };
        /******/
        /******/ 	// Object.prototype.hasOwnProperty.call
        /******/
        __webpack_require__.o = function (object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };
        /******/
        /******/ 	// __webpack_public_path__
        /******/
        __webpack_require__.p = "";
        /******/
        /******/
        /******/ 	// Load entry module and return exports
        /******/
        return __webpack_require__(__webpack_require__.s = "./Example.ts");
        /******/
    })
    /************************************************************************/
    /******/({

        /***/ "./Example.ts":
        /*!********************!*\
          !*** ./Example.ts ***!
          \********************/
        /*! no static exports found */
        /***/ (function (module, exports, __webpack_require__) {

            "use strict";
            eval("\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst tank_bench_profile_1 = __webpack_require__(/*! tank.bench-profile */ \"./node_modules/tank.bench-profile/dist/index.js\");\n// Here is an example module configuration schema\n// You can read the information on creating configuration schemas here:\n// https://github.com/mozilla/node-convict\nconst configSchema = {\n    url: {\n        arg: 'profile.endpoint',\n        format: String,\n        default: \"http://localhost:8080\",\n        doc: \"Url of the node to connect to\"\n    },\n};\nconst prepare = ({ commonConfig, moduleConfig }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is called once in the main thread. Here you can make some preparation transactions,\n    // try your connection to the node, create network accounts etc.\n    // Anything you return from this function will be cloned to benchmark threads via the structured clone algorithm\n    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm\n});\nconst constructBench = ({ benchConfig, threadId }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is called once for every benchmark thread.\n    // Here you can initialize your connection to the blockchain to commit transactions later.\n    // Anything you return from this function will be passed to the commitTransaction function.\n    // For example, you can return the blockchain connection object\n});\nconst destroyBench = ({ benchConfig, threadId, constructData }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is called once for every benchmark thread\n    // after the last transaction is processed.\n    // Here you can destroy your connection to the blockchain.\n});\nconst commitTransaction = ({ benchConfig, constructData, threadId, uniqueData }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is called multiple times for every benchmark thread.\n    // Here you may send the transaction to the blockchain network.\n    // You should return the TransactionResult for the prometheus telemetry to run fine\n    // The uniqueData argument contains string that is unique among other threads and this function calls\n    return { code: 0, error: null };\n});\n// Three functions below are used to provide custom telemetry. They are OPTIONAL, so if you do not want\n// to use the telemetry, just leave the telemetry field of Profile argument undefined.\nconst constructTelemetry = ({ commonConfig, moduleConfig }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is used to construct the telemetry objects like connection to some server\n    // Anything you return from this function will be passed to the onKeyPoint and onBenchEnded functions.\n});\nconst onKeyPoint = ({ avgTps, benchTime, lastLocalTps, processedTransactions, processedTransactionsPerThread, telemetryConfig }) => {\n    // This function is called every commonConfig.telemetryStepInterval milliseconds.\n    // Here you can send data to your server\n    // Don't perform long operations in this function\n};\nconst onBenchEnded = ({ avgTps, benchTime, lastLocalTps, processedTransactions, processedTransactionsPerThread, telemetryConfig }) => __awaiter(void 0, void 0, void 0, function* () {\n    // This function is used to destroy the connection to some telemetry server\n});\nexports.profile = tank_bench_profile_1.Profile({\n    configSchema,\n    prepare,\n    destroyBench,\n    constructBench,\n    commitTransaction,\n    telemetry: {\n        constructTelemetry,\n        onBenchEnded,\n        onKeyPoint\n    }\n});\n\n\n//# sourceURL=webpack://profile/./Example.ts?");

            /***/
        }),

        /***/ "./node_modules/tank.bench-profile/dist/commonConfigSchema.js":
        /*!********************************************************************!*\
          !*** ./node_modules/tank.bench-profile/dist/commonConfigSchema.js ***!
          \********************************************************************/
        /*! no static exports found */
        /***/ (function (module, exports, __webpack_require__) {

            "use strict";
            eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.CommonConfigSchema = {\n    logLevel: {\n        arg: 'common.log.level',\n        format: \"int\",\n        default: 0,\n        doc: \"the level of the log. 0 - only errors, 3 - full log\"\n    },\n    stopOn: {\n        error: {\n            arg: 'common.stopOn.error',\n            format: [\"stop\", \"print\", \"no\"],\n            default: \"no\",\n            doc: \"weather to stop benchmark on blockchain errors or not. Available values - (\\\"stop\\\", \\\"print\\\", \\\"no\\\")\"\n        },\n        processedTransactions: {\n            arg: 'common.stopOn.processedTransactions',\n            format: \"int\",\n            default: -1,\n            doc: \"Stop if achieved this amount of transactions. WARNING: some additional transactions may be processed.\"\n        }\n    },\n    skipPreparation: {\n        arg: 'skipPreparation',\n        format: Boolean,\n        default: false,\n        doc: \"weather to skip the preparation step or not (Bench step will receive commonConfig as config)\"\n    },\n    prometheusTelemetry: {\n        enable: {\n            arg: 'prometheusTelemetry.enable',\n            format: Boolean,\n            default: false,\n            doc: \"weather to send telemetry to promethus gateway or not\"\n        },\n        url: {\n            arg: 'prometheusTelemetry.url',\n            format: String,\n            default: \"\",\n            doc: \"url of prometheus pushgateway\"\n        },\n        user: {\n            arg: 'prometheusTelemetry.user',\n            format: String,\n            default: \"admin\",\n            doc: \"user of prometheus pushgateway. If do not want to use auth, leave blank\"\n        },\n        password: {\n            arg: 'prometheusTelemetry.password',\n            format: String,\n            default: \"admin\",\n            sensitive: true,\n            doc: \"password of prometheus pushgateway. If do not want to use auth, leave blank\"\n        },\n        respCodeBuckets: {\n            arg: 'prometheusTelemetry.respCodeBuckets',\n            format: Array,\n            default: [\n                100,\n                200,\n                300,\n                400,\n                500\n            ],\n            doc: \"possible return codes from node\"\n        },\n        trxsDurationBuckets: {\n            arg: 'prometheusTelemetry.trxsDurationBuckets',\n            format: Array,\n            default: [\n                10,\n                50,\n                100,\n                200,\n                500,\n                2000,\n                10000\n            ],\n            doc: \"buckets for possible transaction durations\"\n        }\n    },\n    telemetryStepInterval: {\n        arg: 'common.dataStepInterval',\n        format: Number,\n        default: 1000,\n        doc: \"call onKeyPoint every N milliseconds\"\n    },\n    tps: {\n        arg: 'common.tps',\n        format: Number,\n        default: -1,\n        doc: \"desired transactions per second\"\n    },\n    threadsAmount: {\n        arg: 'common.threadsAmount',\n        format: \"int\",\n        default: -1,\n        doc: \"amount of threads to perform transfer transactions\"\n    },\n    maxActivePromises: {\n        arg: 'common.maxActivePromises',\n        format: \"int\",\n        default: -1,\n        doc: \"amount of threads to perform transfer transactions\"\n    },\n    sharding: {\n        shards: {\n            arg: 'sharding.shards',\n            format: \"int\",\n            default: -1,\n            doc: \"amount of shards that run the benchmark simultaneously\"\n        },\n        shardId: {\n            arg: 'sharding.shardId',\n            format: \"int\",\n            default: -1,\n            doc: \"id of shard from shards that run the benchmark simultaneously\"\n        }\n    }\n};\n//# sourceMappingURL=commonConfigSchema.js.map\n\n//# sourceURL=webpack://profile/./node_modules/tank.bench-profile/dist/commonConfigSchema.js?");

            /***/
        }),

        /***/ "./node_modules/tank.bench-profile/dist/index.js":
        /*!*******************************************************!*\
          !*** ./node_modules/tank.bench-profile/dist/index.js ***!
          \*******************************************************/
        /*! no static exports found */
        /***/ (function (module, exports, __webpack_require__) {

            "use strict";
            eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nconst commonConfigSchema_1 = __webpack_require__(/*! ./commonConfigSchema */ \"./node_modules/tank.bench-profile/dist/commonConfigSchema.js\");\nexports.CommonConfigSchema = commonConfigSchema_1.CommonConfigSchema;\nconst profile_1 = __webpack_require__(/*! ./profile */ \"./node_modules/tank.bench-profile/dist/profile.js\");\nexports.Profile = profile_1.Profile;\n//# sourceMappingURL=index.js.map\n\n//# sourceURL=webpack://profile/./node_modules/tank.bench-profile/dist/index.js?");

            /***/
        }),

        /***/ "./node_modules/tank.bench-profile/dist/profile.js":
        /*!*********************************************************!*\
          !*** ./node_modules/tank.bench-profile/dist/profile.js ***!
          \*********************************************************/
        /*! no static exports found */
        /***/ (function (module, exports, __webpack_require__) {

            "use strict";
            eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nfunction Profile({ configSchema, prepare, constructBench, commitTransaction, telemetry, destroyBench }) {\n    let constructTelemetry = undefined;\n    if (telemetry) {\n        constructTelemetry = telemetry.constructTelemetry;\n    }\n    return {\n        configSchema,\n        prepare,\n        constructBench,\n        commitTransaction,\n        destroyBench,\n        telemetry\n    };\n}\nexports.Profile = Profile;\n//# sourceMappingURL=profile.js.map\n\n//# sourceURL=webpack://profile/./node_modules/tank.bench-profile/dist/profile.js?");

            /***/
        })

        /******/
    });
});
