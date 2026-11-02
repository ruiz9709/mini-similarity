// Core string similarity algorithms.
//
// Design note: both Levenshtein and Jaro-Winkler operate on UTF-16 code units
// (JavaScript's native string indexing). For the short strings this library
// targets (names, identifiers, labels) this matches user expectations and keeps
// the implementation allocation-free beyond the DP rows. We deliberately do not
// attempt grapheme-cluster handling: it would require Intl.Segmenter or a
// dependency, and the brief forbids third-party code.

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * The distance is the minimum number of single-character insertions,
 * deletions or substitutions required to turn `a` into `b`.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} non-negative integer distance
 */
export function levenshtein(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('levenshtein expects two strings');
  }
  // Fast paths: identical strings and empty strings are the common cases in
  // fuzzy matching, and the DP below would still do the work.
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure `a` is the shorter string so the DP row is as small as possible.
  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const m = a.length;
  const n = b.length;

  // prev[j] = distance between a[0..i-1] and b[0..j].
  // We only need two rows, not the full matrix.
  let prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    const cur = new Array(n + 1);
    cur[0] = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;      // delete a[i-1]
      const ins = cur[j - 1] + 1;   // insert b[j-1]
      const sub = prev[j - 1] + cost; // substitute
      cur[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Normalised Levenshtein similarity in [0, 1].
 *
 * 1 means identical, 0 means maximally different (distance equals the length
 * of the longer string). This is the standard normalisation; it is chosen so
 * that comparing a short string to itself always yields 1 and comparing two
 * empty strings also yields 1.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} similarity in [0, 1]
 */
export function levenshteinSimilarity(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('levenshteinSimilarity expects two strings');
  }
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Compute the Jaro similarity between two strings.
 *
 * Returns a value in [0, 1]; 1 means identical. This is the raw Jaro score,
 * before the Winkler prefix bonus.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} similarity in [0, 1]
 */
export function jaro(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('jaro expects two strings');
  }
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // The match window is floor(max(|a|,|b|)/2) - 1, clamped to 0.
  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);

  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions: matched characters in order in `a` vs `b`.
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const m = matches;
  const t = transpositions / 2;
  return (m / a.length + m / b.length + (m - t) / m) / 3;
}

/**
 * Compute the Jaro-Winkler similarity between two strings.
 *
 * Adds a prefix bonus to the Jaro score: strings sharing a prefix are more
 * similar. The bonus is capped at 4 prefix characters and uses the standard
 * scaling factor 0.1.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} similarity in [0, 1]
 */
export function jaroWinkler(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('jaroWinkler expects two strings');
  }
  const j = jaro(a, b);
  // If Jaro is very low, the prefix bonus is meaningless and can push the
  // score above what the match deserves. The standard formulation still
  // applies the bonus, but only when there is at least one match.
  if (j === 0) return 0;

  let prefix = 0;
  const maxPrefix = Math.min(4, a.length, b.length);
  while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix++;

  return j + prefix * 0.1 * (1 - j);
}
