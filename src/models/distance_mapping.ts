import { Syllable } from './syllable';

export interface DistanceMapping {
    punSyllable: Syllable;
    wordSyllable: Syllable;
    distance: number;
}