// utils.cpp
//
// Implementation of utility functions declared in utils.h.
//
// Implementation notes:
//   - write_result and write_csv: create parent directory if absent (std::filesystem)
//   - write_dot: emit node shapes by role (ESKAPE=box, bridge=ellipse, env=diamond)
//     and colour edges by weight range (red=high, orange=medium, grey=low)
//   - Timer: use std::chrono::high_resolution_clock for sub-millisecond accuracy
