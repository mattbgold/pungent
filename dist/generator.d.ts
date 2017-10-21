import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
export declare class PunGenerator {
    private _config;
    constructor(_config?: PungentConfig);
    generatePuns(targetPhrase: string, punWord: string): PunWord[];
    private _createPun(wordSyllables, punSyllables, distanceMap, substitutionTolerance, injectAtFront?);
    private _flatten(arr);
    private _getRandomElement<T>(arr);
    private _toSyllable(text, index);
}
