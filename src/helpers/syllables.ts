import * as nlp from 'nlp_compromise';
import * as nlpSyllables from 'nlp-syllables';

class NlpSyllablesProvider {
    private static _initialized: boolean = false;

    static getSyllables(term: string): string[][] {
        if (!NlpSyllablesProvider._initialized) {
            NlpSyllablesProvider._init();
        }
        
        let t = nlp.term(term);
        return NlpSyllablesProvider._normalize(t['syllables']());
    }

    private static _init(): void {
        nlp.plugin(nlpSyllables);
        NlpSyllablesProvider._initialized = true;
    }

    private static _normalize(arr: string[] | string[][]): string[][] {
        if (arr[0] instanceof Array) 
            return <string[][]>arr;
        return <string[][]>[arr];
    }
}

export function getSyllables (term: string): string[][] {
    return NlpSyllablesProvider.getSyllables(term);
}
