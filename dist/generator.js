"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var levenshtein_1 = require("./helpers/levenshtein");
var syllables_1 = require("./helpers/syllables");
var PunGenerator = (function () {
    function PunGenerator(_config) {
        this._config = _config;
        this._config = Object.assign({
            syllableReplacementTolerance: .5,
            punFrequency: 1,
            punDistanceThreshold: 10
        }, this._config);
    }
    PunGenerator.prototype.generatePuns = function (targetPhrase, punWord) {
        var _this = this;
        var punSyllables = this._flatten(syllables_1.getSyllables(punWord)).map(this._toSyllable);
        var phraseSyllables = syllables_1.getSyllables(targetPhrase);
        var phraseSyllablesByWord = phraseSyllables.map(function (_) { return _.map(_this._toSyllable); });
        var distinctPhraseSyllables = this._flatten(phraseSyllables)
            .filter(function (value, i, arr) { return arr.indexOf(value) === i; })
            .map(this._toSyllable);
        var globalDistanceMap = distinctPhraseSyllables.map(function (wordSyllable) {
            return punSyllables.map(function (punSyllable) {
                return {
                    punSyllable: punSyllable,
                    wordSyllable: wordSyllable,
                    distance: levenshtein_1.getLevenshteinDistance(punSyllable.text, wordSyllable.text)
                };
            });
        })
            .reduce(function (a, b) { return a.concat(b); }, [])
            .sort(function (a, b) { return a.distance - b.distance; });
        var punPhrase = [];
        phraseSyllablesByWord.forEach(function (word) {
            console.log('\n\nword: ', word.map(function (w) { return w.text; }).join(''));
            //for each word in the phrase, turn it into a pun
            var distanceMapForWord = globalDistanceMap.filter(function (x) { return word.map(function (s) { return s.text; }).includes(x.wordSyllable.text); });
            var punnedWord;
            var isPun = false;
            if (word.length == 1 || Math.random() > _this._config.punFrequency)
                punnedWord = word; //skip word with only one syllable
            else {
                isPun = true;
                punnedWord = _this._createPun(word, punSyllables, distanceMapForWord, 1);
            }
            console.log('=== ', punnedWord.map(function (s) { return s.text; }).join(''));
            punPhrase.push({
                isPun: isPun,
                syllables: punnedWord,
                punScore: punnedWord.reduce(function (sum, curr) { return sum + curr.distanceScore; }, 0)
            });
        });
        console.log('\n' + punPhrase.map(function (p) { return p.syllables.map(function (s) { return s.text; }).join(''); }).join(' ') + '\n the best pun was ' + punPhrase.filter(function (p) { return p.isPun; }).sort(function (a, b) { return a.punScore - b.punScore; })[0].syllables.map(function (s) { return s.text; }).join(''));
        return punPhrase;
    };
    PunGenerator.prototype._createPun = function (wordSyllables, punSyllables, distanceMap, substitutionTolerance, injectAtFront) {
        if (!wordSyllables.length)
            return punSyllables;
        if (!punSyllables.length)
            return wordSyllables;
        console.log('current syllables: ', wordSyllables.map(function (x) { return x.text; }).join('.'));
        distanceMap = distanceMap.filter(function (m) {
            return wordSyllables.map(function (s) { return s.text; }).includes(m.wordSyllable.text)
                && punSyllables.map(function (s) { return s.text; }).includes(m.punSyllable.text);
        });
        var mappingToUse = this._getRandomElement(distanceMap.filter(function (mapping) { return mapping.distance === distanceMap[0].distance; }));
        var syllableToReplace;
        var wordIndex;
        if (mappingToUse.distance <= Math.max(mappingToUse.punSyllable.text.length, mappingToUse.wordSyllable.text.length) * substitutionTolerance) {
            console.log(mappingToUse.wordSyllable.text + " ==> " + mappingToUse.punSyllable.text);
            //if the pun syllable is close enough to a syllable in the word, replace it
            syllableToReplace = wordSyllables.find(function (s) { return s.text === mappingToUse.wordSyllable.text; });
            syllableToReplace.text = mappingToUse.punSyllable.text;
            syllableToReplace.distanceScore = mappingToUse.distance;
            wordIndex = syllableToReplace.index;
        }
        else {
            //otherwise, insert the pun syllable to the front or back of the word
            var newSyllable = {
                text: mappingToUse.punSyllable.text,
                index: mappingToUse.punSyllable.index,
                distanceScore: mappingToUse.punSyllable.text.length
            };
            if (injectAtFront) {
                console.log('INSERT FRONT', newSyllable.text);
                wordSyllables.unshift(newSyllable);
                wordIndex = 0;
            }
            else {
                console.log('INSERT BACK', newSyllable.text);
                wordSyllables.push(newSyllable);
                wordIndex = wordSyllables.length;
            }
        }
        var remainingPunLeft = punSyllables.filter(function (s) { return s.index < mappingToUse.punSyllable.index; });
        var remainingWordLeft = wordSyllables.filter(function (s) { return s.index < wordIndex; });
        var remainingPunRight = punSyllables.filter(function (s) { return s.index > mappingToUse.punSyllable.index; });
        var remainingWordRight = wordSyllables.filter(function (s) { return s.index > wordIndex; });
        console.log(remainingWordLeft.map(function (s) { return s.text; }).join('.'), syllableToReplace ? '|' + syllableToReplace.text + '|' : '|', remainingWordRight.map(function (s) { return s.text; }).join('.'));
        console.log(remainingPunLeft.map(function (s) { return s.text; }).join('.'), remainingPunRight.map(function (s) { return s.text; }).join('.'));
        return this._createPun(remainingWordLeft, remainingPunLeft, distanceMap, this._config.replacementTolerance)
            .concat(syllableToReplace ? [syllableToReplace] : [])
            .concat(this._createPun(remainingWordRight, remainingPunRight, distanceMap, this._config.replacementTolerance, true));
    };
    PunGenerator.prototype._flatten = function (arr) {
        return (arr).reduce(function (a, b) { return a.concat(b); }, []);
    };
    PunGenerator.prototype._getRandomElement = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };
    PunGenerator.prototype._toSyllable = function (text, index) {
        return {
            text: text,
            index: index
        };
    };
    return PunGenerator;
}());
exports.PunGenerator = PunGenerator;
