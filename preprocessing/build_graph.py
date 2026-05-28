# build_graph.py
#
# High-level purpose:
# - Parse curated biological datasets (prevalence tables, co-occurrence matrices, etc.)
# - Filter and select relevant species and ARGs
# - Compute pairwise similarity/transfer likelihood weights
# - Emit a compact adjacency file format for the C++ engine in `../data/processed/`
#
# Implementation notes (to add later):
# - Use pandas for tabular data processing
# - Keep I/O and transformation logic separated for easier testing
# - Provide CLI args for input/output paths and filtering thresholds
