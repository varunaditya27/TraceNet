# Preprocessing

This folder holds Python scripts that convert biological source data into the compact adjacency format consumed by the C++ graph engine.

Guidance:
- `build_graph.py` should read raw data from `../data/`, filter and map species/ARGs, compute weights, and write an adjacency file into `../data/processed/`.
- Keep data cleaning and feature engineering steps modular and testable.
