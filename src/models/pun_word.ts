import { Syllable } from './syllable';

export interface PunWord {
    isPun: boolean;
    syllables: Syllable[];
    punScore: number;
}