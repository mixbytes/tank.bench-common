const {BenchProfile} = require("../../../dist/lib/index");

class SimpleBenchProfileExt extends BenchProfile {
    async commitTransaction(uniqueData) {
        return new Promise(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 1);
        });
    }
}

module.exports = SimpleBenchProfileExt;
