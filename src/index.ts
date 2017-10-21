import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
import { PunGenerator } from './generator';

export function generatePuns(targetPhrase: string, punWord: string, options?: PungentConfig): PunWord[] {
    let generator = new PunGenerator(options);

    return generator.generatePuns(targetPhrase, punWord);
}

export type PunGenerator = PunGenerator;