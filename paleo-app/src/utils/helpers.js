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
    const raw = String(entry.annee || '9999').trim();
    const text = raw.toLowerCase();
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isBc = normalized.includes('av') || normalized.includes('bc') || normalized.includes('bef') || normalized.includes('before') || normalized.startsWith('-');

    // 1) Century formats (FR + EN), e.g. "XXIe siècle", "XXIth century", "21st century"
    const arabicCentury = normalized.match(/\b(\d{1,2})(?:er|e|eme|eme|st|nd|rd|th)?\s*(?:siecle|century)\b/i);
    if (arabicCentury) {
        const c = parseInt(arabicCentury[1], 10);
        // Place at the middle of the century for timeline ordering
        let val = (c - 1) * 100 + 50;
        if (isBc) val = -Math.abs(val);
        return val;
    }

    const romanCentury = normalized.match(/\b([mdclxvi]+)(?:er|e|eme|st|nd|rd|th)?\s*(?:siecle|century)\b/i);
    if (romanCentury) {
        const c = romanToInt(romanCentury[1]);
        let val = (c - 1) * 100 + 50;
        if (isBc) val = -Math.abs(val);
        return val;
    }

    // 2) Explicit year digits (e.g. 2025)
    const matchDigit = text.match(/\d+/);
    if (matchDigit) {
        let val = parseInt(matchDigit[0], 10);
        if (isBc) val = -Math.abs(val);
        return val;
    }

    // 3) Standalone roman tokens fallback
    const matchRoman = text.match(/\b[mdclxvi]+\b/i);
    if (matchRoman) {
        let val = romanToInt(matchRoman[0]) * 100;
        if (isBc) val = -Math.abs(val);
        return val;
    }
    return 9999;
};

/** Retourne le suffixe ordinal anglais pour un entier (1→"st", 2→"nd", 3→"rd", N→"th") */
const enOrdinal = (n) => {
    const abs = Math.abs(n);
    const mod100 = abs % 100;
    if (mod100 >= 11 && mod100 <= 13) return 'th';
    switch (abs % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

/** Retourne le suffixe ordinal français pour un entier (1→"er", N→"e") */
const frOrdinal = (n) => (n === 1 ? 'er' : 'e');

export const formatYear = (yearStr, lang) => {
    if (!yearStr) return '';
    let val = String(yearStr);

    // Check if English (accept 'en', 'en-US', 'en-GB'...)
    const isEn = lang && lang.startsWith('en');

    if (isEn) {
        // ── Qualificatifs temporels FR → EN ──────────────────────────
        // "vers", "environ" → "c.", "début" → "early", "fin" → "late"
        val = val.replace(/\b(?:vers\s+le|vers\s+la|vers\s+l[''']?|vers)\b/gi, 'c.');
        val = val.replace(/\benviron\b/gi, 'c.');
        val = val.replace(/\bc\.\s+c\./gi, 'c.'); // évite double "c. c."
        val = val.replace(/\b(?:début\s+du|début\s+de\s+la|début\s+de\s+l[''']?|début)\b/gi, 'early');
        val = val.replace(/\b(?:fin\s+du|fin\s+de\s+la|fin\s+de\s+l[''']?|fin)\b/gi, 'late');
        val = val.replace(/\b(?:milieu\s+du|milieu\s+de\s+la|milieu\s+de\s+l[''']?|milieu)\b/gi, 'mid-');

        // ── Plages avec chiffres romains + siècle(s) en fin de groupe ──
        // "XIVe au XVIe siècles" → "14th to 16th centuries"
        // Stratégie : convertir les chiffres romains orphelins (sans "siècle" juste après)
        // qui sont suivis d'un connecteur puis d'un autre siècle dans la même expression.
        val = val.replace(
            /\b([MDCLXVI]+)(?:er|e|ème|eme)?(?=\s*(?:au|et|à|à la|[-–—])\s*(?:[MDCLXVI]+|\d+)(?:er|e|ème|eme)?\s*si[eè]cles?)\b/gi,
            (_, roman) => {
                const n = romanToInt(roman.toUpperCase());
                if (!n) return _;
                return `${n}${enOrdinal(n)}`;
            }
        );
        val = val.replace(
            /\b(\d+)(?:er|e|ème|eme)?(?=\s*(?:au|et|à|à la|[-–—])\s*(?:[MDCLXVI]+|\d+)(?:er|e|ème|eme)?\s*si[eè]cles?)\b/gi,
            (_, num) => {
                const n = parseInt(num, 10);
                return `${n}${enOrdinal(n)}`;
            }
        );

        // ── Siècles chiffres romains FR → EN (singulier ET pluriel) ───
        // "XIVe siècle", "XIVème siècle", "xive siecle", "XIVe siècles" → "14th century/centuries"
        val = val.replace(
            /\b([MDCLXVI]+)(?:er|e|ème|eme)?\s*si[eè]cles?\b/gi,
            (_, roman) => {
                const n = romanToInt(roman.toUpperCase());
                if (!n) return _;
                return `${n}${enOrdinal(n)} century`;
            }
        );

        // ── Siècles chiffres arabes FR → EN (singulier ET pluriel) ────
        // "14e siècle", "14ème siècle", "14 siècle", "XIVe et XVe siècles" → "14th century"
        val = val.replace(
            /\b(\d+)(?:er|e|ème|eme)?\s*si[eè]cles?\b/gi,
            (_, n) => {
                const num = parseInt(n, 10);
                return `${num}${enOrdinal(num)} century`;
            }
        );

        // ── Pluriel "centuries" pour les chiffres ordinaux consécutifs ─
        // "14th century to 16th century" → "14th to 16th centuries"
        val = val.replace(
            /\b((\d+(?:st|nd|rd|th)\s+(?:to|and|[-–—])\s+)+\d+(?:st|nd|rd|th))\s+century\b/gi,
            '$1 centuries'
        );

        // ── BC / AD ───────────────────────────────────────────────────
        val = val.replace(/(av|avant)\.?\s*J\.?-?C\.?/gi, 'BC');
        val = val.replace(/(ap|apres|après)\.?\s*J\.?-?C\.?/gi, 'AD');

    } else {
        // ── Qualificatifs temporels EN → FR ──────────────────────────
        val = val.replace(/\bc\./gi, 'vers');
        val = val.replace(/\bearly\b/gi, 'Début');
        val = val.replace(/\blate\b/gi, 'Fin');
        val = val.replace(/\bmid-?\b/gi, 'Milieu');

        // ── Siècles anglais → FR (singulier ET pluriel) ──────────────
        // "14th century", "21st century", "14th centuries", "14 century" → "14e siècle"
        val = val.replace(
            /\b(\d+)(?:st|nd|rd|th)?\s*centur(?:y|ies)\b/gi,
            (_, n) => {
                const num = parseInt(n, 10);
                return `${num}${frOrdinal(num)} siècle`;
            }
        );

        // ── BC / AD → FR ──────────────────────────────────────────────
        val = val.replace(/\bB\.?C\.?\b/gi, 'av. J.-C.');
        val = val.replace(/\bA\.?D\.?\b/gi, 'ap. J.-C.');
    }
    return val;
};
