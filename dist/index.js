"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var generator_1 = require("./generator");
function generatePuns(targetPhrase, punWord, options) {
    var generator = new generator_1.PunGenerator(options);
    return generator.generatePuns(targetPhrase, punWord);
}
exports.generatePuns = generatePuns;
