// boyer_moore.h
//
// Boyer-Moore string search on CARD FASTA nucleotide sequences.
//
// Purpose: demonstrate sub-linear pattern matching by searching for a 30bp
// primer-length query within the NDM-1 reference sequence. The text is the
// NDM-1 sequence doubled (seq + seq) to guarantee exactly 2 matches and
// allow meaningful speedup comparison against naive search.
//
// Result struct to implement:
//   BMResult {
//     vector<int> match_positions — 0-based positions where pattern found
//     long comparisons_bm         — character comparisons made by Boyer-Moore
//     long comparisons_naive      — character comparisons by naive search
//   }
//
// Interface to implement in boyer_moore.cpp:
//   vector<int> bad_char_table(const string& pattern)  — build shift table
//   BMResult boyer_moore(const string& text, const string& pattern)
//   BMResult naive_search(const string& text, const string& pattern)
//   string load_fasta_sequence(const string& path, const string& dag_name)
//
// Uses bad-character heuristic only (DNA 4-char alphabet: A, T, G, C).
// Good-suffix heuristic is optional; bad-character alone is sufficient for demo.
// Time: O(nm) worst case, O(n/m) average for DNA sequences.  Space: O(4).
// Syllabus: Unit III.
