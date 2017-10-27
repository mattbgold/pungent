import * as nlp from 'nlp_compromise';
import * as nlpSyllables from 'nlp-syllables';
import { getLevenshteinDistance } from './helpers/levenshtein';
import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
import { DistanceMapping } from './models/distance_mapping';
import { Syllable } from './models/syllable';
import { getSyllables } from './helpers/syllables';


export class PunGenerator {
    constructor(private _config?: PungentConfig) {
        this._config = Object.assign({
            replacementTolerance: .5,
            punFrequency: 1,
            punScoreTolerance: 1
        }, this._config);
    }

    generatePuns(targetPhrase: string, punWord: string): PunWord[] {
        targetPhrase = targetPhrase.trim().replace(/\s+|\t/g, ' ');
        punWord = punWord.trim();

        let punctuation = targetPhrase
            .split(' ')
            .map(word => this._getPunctuation(word));

        let capitalization = targetPhrase
            .split(' ')
            .map(word => /[A-Z]/.test(word.charAt(0)));

        let punSyllables: Syllable[] = this._flatten(getSyllables(punWord)).map(this._toSyllable);
        punSyllables.forEach(s => s.distanceScore = s.text.length);
        
        let phraseSyllables = getSyllables(targetPhrase);
        let phraseSyllablesByWord: Syllable[][] = phraseSyllables.map(_ => _.map(this._toSyllable));

        let distinctPhraseSyllables = this._flatten(phraseSyllables)
            .filter((value, i, arr) => arr.indexOf(value) === i)
            .map(this._toSyllable);
    
        let globalDistanceMap: DistanceMapping[] = 
            distinctPhraseSyllables.map(wordSyllable => 
                punSyllables.map(punSyllable => {
                return {
                        punSyllable,
                        wordSyllable,
                        distance: getLevenshteinDistance(punSyllable.text, wordSyllable.text)
                    };
                }))
            .reduce((a, b) => a.concat(b), [])
            .sort((a,b) => a.distance - b.distance);
    
        const punPhrase: PunWord[] = [];
        let remainingWordsToPun = phraseSyllablesByWord.length * this._config.punFrequency;
        const randomIndexes = this._shuffle(phraseSyllablesByWord.map((_, i) => i));

        for(let i = 0; i < phraseSyllablesByWord.length; i++) {
            const word = phraseSyllablesByWord[randomIndexes[i]];

            let distanceMapForWord: DistanceMapping[] = globalDistanceMap.filter(x => word.map(s => s.text).includes(x.wordSyllable.text));
            
            let processedWord: Syllable[];
            let isPun = false;
            let punScore = 0;
            if (remainingWordsToPun === 0 || /^[^\w]*$/.test(word.map(x => x.text).join('')))
                processedWord = word;
            else {
                isPun = true;
                let pun = this._createPun(this._cloneWord(word), punSyllables, distanceMapForWord, 1);
                punScore = pun.reduce((sum, curr) => sum + curr.distanceScore, 0);

                //lower scores are better
                const worstScorePossible = Math.max(word.map(w => w.text).join('').length, punWord.length);

                if (punScore > Math.round(this._config.punScoreTolerance * worstScorePossible) 
                    || (word.length === 1 && punScore > 0)) {
                    // don't use the pun if it's too much of a stretch, and only use single-syllable puns if they have a perfect score.
                    processedWord = word;
                } else {
                    processedWord = pun;
                    remainingWordsToPun--;
                }
            }

            if (capitalization[randomIndexes[i]]) {
                processedWord[0].text = processedWord[0].text.charAt(0).toUpperCase() + processedWord[0].text.slice(1);
            }

            punPhrase[randomIndexes[i]] = {
                word: this._applyPunctuation(processedWord.map(s => s.text).join(''), punctuation[randomIndexes[i]]),
                originalWord: this._applyPunctuation(word.map(s => s.text).join(''), punctuation[randomIndexes[i]]),
                isPun,
                punScore
            };
        }

        if (this._config.logToConsole) {
            console.log(punPhrase.map(p => p.word).join(' '));
        }
        

        return punPhrase;
    }

    private _createPun(wordSyllables: Syllable[], punSyllables: Syllable[], distanceMap: DistanceMapping[], substitutionTolerance: number, injectAtFront?: boolean): Syllable[] {
        if (!wordSyllables.length)
            return punSyllables;
        if (!punSyllables.length)
            return wordSyllables;
        
        distanceMap = distanceMap.filter(m => 
            wordSyllables.map(s => s.text).includes(m.wordSyllable.text) 
            && punSyllables.map(s => s.text).includes(m.punSyllable.text));
    
            //pick one of the syllable mappings that have the shortest distance
        let mappingToUse = this._getRandomElement(distanceMap.filter(mapping => mapping.distance === distanceMap[0].distance));
    
        let syllableToReplace: Syllable;
        let wordIndex: number;
        
        const highestDistancePossible = Math.max(mappingToUse.punSyllable.text.length, mappingToUse.wordSyllable.text.length);
        if (mappingToUse.distance <= substitutionTolerance * highestDistancePossible) {
            //if the pun syllable is close enough to a syllable in the word, replace it
            syllableToReplace = wordSyllables.find(s => s.text === mappingToUse.wordSyllable.text);
    
            syllableToReplace.text = mappingToUse.punSyllable.text
            syllableToReplace.distanceScore = mappingToUse.distance;
    
            wordIndex = syllableToReplace.index;
            
        } else {
            //otherwise, insert the pun syllable to the front or back of the word
            let newSyllable: Syllable = {
                text: mappingToUse.punSyllable.text,
                index: mappingToUse.punSyllable.index,
                distanceScore: mappingToUse.punSyllable.text.length
            };
    
            if (injectAtFront) {
                wordSyllables.unshift(newSyllable);
                wordIndex = 0;
            } 
            else {
                wordSyllables.push(newSyllable);
                wordIndex = wordSyllables.length
            }
        }
    
        let remainingPunLeft = punSyllables.filter(s => s.index < mappingToUse.punSyllable.index);
        let remainingWordLeft = wordSyllables.filter(s => s.index < wordIndex);
        
        let remainingPunRight = punSyllables.filter(s => s.index > mappingToUse.punSyllable.index);
        let remainingWordRight = wordSyllables.filter(s => s.index > wordIndex);
    
        return this._createPun(remainingWordLeft, remainingPunLeft, distanceMap, this._config.replacementTolerance, false)
            .concat(syllableToReplace ? [syllableToReplace] : [])
            .concat(this._createPun(remainingWordRight, remainingPunRight, distanceMap, this._config.replacementTolerance, true));
    }

    private _getPunctuation(word: string) {
        if (word.length <= 1) {
            return word;
        }

        let lastCharacters  = word.slice(-2);

        if (/[^\w]/.test(lastCharacters[0])) {
            return lastCharacters;
        }

        return /[^\w]/.test(lastCharacters[1]) ? lastCharacters[1] : '';
    }

    private _applyPunctuation(word: string, punctuation: string) {
        return word.substring(0, word.length - punctuation.length) + punctuation;
    }

    private _flatten(arr: string[][]): string[] {
        return (arr).reduce((a,b) => a.concat(b), []);
    }

    private _getRandomElement<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private _shuffle(array: any[]) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    private _toSyllable(text: string, index: number): Syllable {
        return {
            text,
            index,
            distanceScore: 0
        }
    }

    private _cloneWord(word: Syllable[]): Syllable[] {
        return word.map(s => {
            return {
                text: s.text,
                distanceScore: s.distanceScore,
                index: s.index
            };
        });
    }
}