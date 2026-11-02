// Public entry point for mini-similarity.
//
// The library exposes four functions: two distance/similarity measures for
// Levenshtein, and the Jaro and Jaro-Winkler scores. All inputs are strings
// and all similarity outputs are in [0, 1].

export { levenshtein, levenshteinSimilarity, jaro, jaroWinkler } from './core.js';
