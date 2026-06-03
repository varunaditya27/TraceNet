#include "boyer_moore.h"

#include <algorithm>
#include <array>
#include <fstream>
std::vector<int> boyerMooreSearch(const std::string& text, const std::string& pattern) {
    std::vector<int> matches;
    if (pattern.empty() || pattern.size() > text.size()) {
        return matches;
    }

    std::array<int, 256> last;
    last.fill(-1);
    for (std::size_t i = 0; i < pattern.size(); ++i) {
        last[static_cast<unsigned char>(pattern[i])] = static_cast<int>(i);
    }

    std::size_t shift = 0;
    while (shift + pattern.size() <= text.size()) {
        int j = static_cast<int>(pattern.size()) - 1;
        while (j >= 0 && pattern[j] == text[shift + j]) {
            --j;
        }
        if (j < 0) {
            matches.push_back(static_cast<int>(shift));
            shift += 1;
        } else {
            const unsigned char mismatch = static_cast<unsigned char>(text[shift + j]);
            shift += static_cast<std::size_t>(std::max(1, j - last[mismatch]));
        }
    }
    return matches;
}

std::string readFastaFile(const std::string& filename) {
    std::ifstream input(filename);
    if (!input) {
        return {};
    }

    std::string sequence;
    std::string line;
    while (std::getline(input, line)) {
        if (line.empty()) {
            continue;
        }
        if (line.front() == '>') {
            if (!sequence.empty()) {
                break;
            }
            continue;
        }
        sequence += line;
    }
    return sequence;
}
