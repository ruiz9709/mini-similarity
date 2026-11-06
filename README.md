# mini-similarity

Tiny zero-dependency string similarity for fuzzy matching of short strings: Levenshtein distance and similarity, plus Jaro and Jaro-Winkler scores.

```js
import { levenshtein, jaroWinkler } from 'mini-similarity';

levenshtein('kitten', 'sitting'); // 3
jaroWinkler('MARTHA', 'MARHTA');  // ~0.9611
```

## Why this exists

Fuzzy matching short strings (names, identifiers, labels) usually means picking
between an edit-distance measure and a token-based one. Levenshtein is easy to
reason about but penalises long strings heavily; Jaro-Winkler is better for
short strings and rewards shared prefixes. This library provides both, with no
dependencies and no configuration, so you can drop it into a browser or a Node
script without a build step.

The trade-off: all functions operate on UTF-16 code units, not grapheme
clusters. For the short ASCII-ish strings this is meant for, that is the right
call. If you need emoji or combining-character awareness, you want a different
tool.

## API

All similarity functions return a number in `[0, 1]`; `1` means identical.
All functions throw `TypeError` if given a non-string argument.

- `levenshtein(a, b)` — edit distance, a non-negative integer.
- `levenshteinSimilarity(a, b)` — `1 - distance / max(len(a), len(b))`, so two empty strings score `1`.
- `jaro(a, b)` — raw Jaro similarity.
- `jaroWinkler(a, b)` — Jaro with the standard prefix bonus (up to 4 characters, scaling 0.1).

## Edge cases

- Empty vs empty is `1` for both similarity measures and for Jaro/Jaro-Winkler.
- Empty vs non-empty is `0` for Jaro/Jaro-Winkler and for `levenshteinSimilarity`.
- `jaroWinkler` applies the prefix bonus only when Jaro is non-zero, so two strings with no matching characters score exactly `0`.
- Comparison is by UTF-16 code unit. `'\u00e9'` (e-acute) and `'e' + '\u0301'` (e plus combining acute) are different strings to this library.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

