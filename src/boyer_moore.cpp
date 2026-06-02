// boyer_moore.cpp
//
// Implementation of Boyer-Moore search declared in boyer_moore.h.
//
// Implementation notes:
//   - bad_char_table: map each character → its last occurrence index in pattern.
//     Characters not in pattern map to -1 (shift = j + 1).
//   - boyer_moore loop: scan right-to-left within the pattern window.
//     On mismatch at position j: shift = max(1, j - bad_char[text[s+j]]).
//     On full match (j < 0): record position s, then shift by 1.
//   - Count ALL character comparisons (including the final mismatch comparison).
//   - naive_search: O(nm) left-to-right for comparison baseline.
//   - load_fasta_sequence: read arg_sequences.fasta, find header line matching
//     dag_name (e.g., "blaNDM1"), return the sequence string.
//   - Demo setup: pattern = first 30 characters of NDM-1 sequence;
//     text = NDM-1 sequence concatenated with itself.
//     Expected matches: 2 (at positions 0 and len(seq)).
//   - Write results to results/bm_search.txt showing match positions and
//     comparison counts. Include speedup ratio naive/BM.
