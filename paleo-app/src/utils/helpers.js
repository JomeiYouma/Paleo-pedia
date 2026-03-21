export const romanToInt = (s) => {
    if (!s) return 0;
    const roman = { 'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000 };
    let num = 0;
    try {
        s = s.toUpperCase();
        for (let i = 0; i < s.length - 1; i++) {
            if (roman[s[i]] < roman[s[i + 1]]) {
                num -= roman[s[i]];
            } else {
                num += roman[s[i]];
            }
        }
        num += roman[s[s.length - 1]];
        return num;
    } catch { return 0; }
};

export const getYearForSort = (entry) => {
    const text = String(entry.annee || '9999').toLowerCase().trim();
    const isBc = text.includes('av') || text.includes('bc') || text.includes('bef') || text.startsWith('-');

    // Check for digits
    const matchDigit = text.match(/\d+/);
    if (matchDigit) {
        let val = parseInt(matchDigit[0], 10);
        if (isBc) val = -Math.abs(val);
        return val;
    }

    // Check for roman
    const matchRoman = text.match(/\b[mdclxvi]+\b/i);
    if (matchRoman) {
        let val = romanToInt(matchRoman[0]) * 100; // Rough century estimation if needed or logic from python
        // Python code: roman_to_int(...) * 100 ?? Wait, let's check python code.
        // Python: val = roman_to_int(match_roman.group()) * 100. YES.
        if (isBc) val = -Math.abs(val);
        return val;
    }
    return 9999;
};

export const formatYear = (yearStr, lang) => {
    if (!yearStr) return '';
    let val = String(yearStr);

    // Check if English (accept 'en', 'en-US', 'en-GB'...)
    const isEn = lang && lang.startsWith('en');

    if (isEn) {
        // FR -> EN
        // Replace "av. J.-C.", "av JC", "avant JC", "av.JC" => "BC"
        // Also handling "avant" explicitly if needed
        val = val.replace(/(av|avant)\.?\s*J\.?-?C\.?/gi, 'BC');

        // Optional: "ap. J.-C." -> "AD"
        val = val.replace(/(ap|apres|après)\.?\s*J\.?-?C\.?/gi, 'AD');
    } else {
        // EN -> FR
        // "BC" or "B.C." -> "av. J.-C."
        val = val.replace(/\bB\.?C\.?\b/gi, 'av. J.-C.');
        // "AD" -> "ap. J.-C."
        val = val.replace(/\bA\.?D\.?\b/gi, 'ap. J.-C.');
    }
    return val;
};
