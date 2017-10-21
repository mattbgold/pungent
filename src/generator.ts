import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
import { DistanceMapping } from './models/distance_mapping';
import { Syllable } from './models/syllable';

import * as nlp from 'nlp_compromise';
import * as nlpSyllables from 'nlp-syllables';
import { getLevenshteinDistance } from './helpers/levenshtein';
import { getSyllables } from './helpers/syllables';

export class PunGenerator {
    constructor(private _config?: PungentConfig) {
        this._config = Object.assign({
            syllableReplacementTolerance: .5,
            punFrequency: 1,
            punDistanceThreshold: 10
        }, this._config);
    }

    generatePuns(targetPhrase: string, punWord: string): PunWord[] {
        let punSyllables: Syllable[] = this._flatten(getSyllables(punWord)).map(this._toSyllable);
        
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
    
        let punPhrase: PunWord[] = [];
    
        phraseSyllablesByWord.forEach(word => {
            //for each word in the phrase, turn it into a pun
            let distanceMapForWord: DistanceMapping[] = globalDistanceMap.filter(x => word.map(s => s.text).includes(x.wordSyllable.text));
            
            let punnedWord: Syllable[];
            let isPun = false;
            if (word.length == 1 || Math.random() > this._config.punFrequency)
                punnedWord = word; //skip word with only one syllable
            else {
                isPun = true;
                punnedWord = this._createPun(word, punSyllables, distanceMapForWord, 1);
            }
               
            punPhrase.push({
                isPun,
                syllables: punnedWord,
                punScore: punnedWord.reduce((sum, curr) => sum + curr.distanceScore, 0)
            });
        });
    
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
    
            
    
        let mappingToUse = this._getRandomElement(distanceMap.filter(mapping => mapping.distance === distanceMap[0].distance));
    
        let syllableToReplace: Syllable;
        let wordIndex: number;
    
        if (mappingToUse.distance <= Math.max(mappingToUse.punSyllable.text.length, mappingToUse.wordSyllable.text.length) * substitutionTolerance) {
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
    
        return this._createPun(remainingWordLeft, remainingPunLeft, distanceMap, this._config.replacementTolerance)
            .concat(syllableToReplace ? [syllableToReplace] : [])
            .concat(this._createPun(remainingWordRight, remainingPunRight, distanceMap, this._config.replacementTolerance, true));
    }

    private _flatten(arr: string[][]): string[] {
        return (arr).reduce((a,b) => a.concat(b), []);
    }
    private _getRandomElement<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    
    private _toSyllable(text: string, index: number): Syllable {
        return {
            text,
            index
        }
    }
}