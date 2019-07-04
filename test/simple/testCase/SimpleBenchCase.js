const {BenchCase} = require("../../../dist/lib/index");

class SimpleBenchCase extends BenchCase {
    async commitTransaction(uniqueData) {
        return new Promise(resolve => {
            let code = Math.random() > 0.5 ? 200 : 500;
            setTimeout(() => {
                resolve({code: code, error: null})
            }, 100);
        });
    }
}

module.exports = SimpleBenchCase;
