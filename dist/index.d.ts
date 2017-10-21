import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
import { PunGenerator } from './generator';
export declare function generatePuns(targetPhrase: string, punWord: string, options?: PungentConfig): PunWord[];
export declare type PunGenerator = PunGenerator;
