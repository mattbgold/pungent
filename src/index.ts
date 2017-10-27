import { DuplexOptions, Transform } from 'stream';
import * as through2 from 'through2';
import { PungentConfig } from './models/config';
import { PunWord } from './models/pun_word';
import { PunGenerator } from './generator';


export function generatePuns(targetPhrase: string, punWord: string, options?: PungentConfig): PunWord[] {
    let generator = new PunGenerator(options);

    return generator.generatePuns(targetPhrase, punWord);
}

export function transformPuns(punWord: string, generator: PunGenerator): Transform {
    return through2((chunk, enc, callback) => {
        let pun = generator.generatePuns(chunk.toString(), punWord);
        callback(null, pun.map(p => p.word).join(' '));
    }); 
}

export { PunGenerator } from './generator';