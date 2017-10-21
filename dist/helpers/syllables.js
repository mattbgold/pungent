"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nlp = require("nlp_compromise");
var nlpSyllables = require("nlp-syllables");
var NlpSyllablesProvider = (function () {
    function NlpSyllablesProvider() {
    }
    NlpSyllablesProvider.getSyllables = function (term) {
        if (!NlpSyllablesProvider._initialized) {
            NlpSyllablesProvider._init();
        }
        var t = nlp.term(term);
        return NlpSyllablesProvider._normalize(t['syllables']());
    };
    NlpSyllablesProvider._init = function () {
        nlp.plugin(nlpSyllables);
        NlpSyllablesProvider._initialized = true;
    };
    NlpSyllablesProvider._normalize = function (arr) {
        if (arr[0] instanceof Array)
            return arr;
        return [arr];
    };
    return NlpSyllablesProvider;
}());
NlpSyllablesProvider._initialized = false;
function getSyllables(term) {
    return NlpSyllablesProvider.getSyllables(term);
}
exports.getSyllables = getSyllables;
