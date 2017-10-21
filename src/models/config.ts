export interface PungentConfig {
    replacementTolerance?: number; //between 0 and 1, decrease this to make it syllable substitution more strict 
    punFrequency?: number; // between 0 and 1, the percentage of phrase words that will be converted into puns
    punDistanceThreshold?: number; // the combined levenshtein distance over which a pun will be aborted
}