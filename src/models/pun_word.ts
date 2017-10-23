import { Syllable } from './syllable';

export interface PunWord {
    isPun: boolean;
    punScore: number;
    originalWord: string;
    word: string;
}