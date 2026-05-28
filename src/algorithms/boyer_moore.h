// boyer_moore.h
//
// Boyer-Moore string matching algorithm.
// Used for:
// - fast pattern matching in ARG (Antibiotic Resistance Gene) reference strings
// - locating known gene signatures
// - demonstrating space-time trade-offs in string searching
//
// Interface to add later:
// - boyer_moore_search(text, pattern) -> vector of match positions
// - precompute_bad_character_table(pattern) -> map
// - precompute_good_suffix_table(pattern) -> vector
