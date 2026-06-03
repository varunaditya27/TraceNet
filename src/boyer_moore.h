#ifndef TRACENET_BOYER_MOORE_H
#define TRACENET_BOYER_MOORE_H

#include <string>
#include <vector>

std::vector<int> boyerMooreSearch(const std::string& text, const std::string& pattern);
std::string readFastaFile(const std::string& filename);

#endif
