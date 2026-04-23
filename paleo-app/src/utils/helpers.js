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

// FIX 5 : valide que le résultat romanToInt est plausible (> 0 et <= 4999)
const isValidRoman = (s) => {
    const n = romanToInt(s);
    return n > 0 && n <= 4999;
};

export const getYearForSort = (entry) => {
    const raw = String(entry.annee || '9999').trim();
    const text = raw.toLowerCase();
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // FIX 4 : détection BC plus stricte — on exige un mot-clé explicite ou un signe '-' suivi de chiffres
    const isBc = normalized.includes('av') ||
        normalized.includes('bc') ||
        normalized.includes('bef') ||
        normalized.includes('before') ||
        /^-\d/.test(normalized);

    const hasFin = /\b(fin|late)\b/i.test(normalized);
    const hasMilieu = /\b(milieu|mid-?)\b/i.test(normalized);

    const calcCenturyVal = (c) => {
        if (hasFin) {
            return isBc ? -(((c - 1) * 100) + 1) : c * 100;
        }
        if (hasMilieu) {
            return isBc ? -(c * 100 - 50) : (c - 1) * 100 + 50; 
        }
        // default or 'début'
        return isBc ? -(c * 100) : ((c - 1) * 100) + 1;
    };

    // 1) Century formats (FR + EN), e.g. "XXIe siècle", "XXIth century", "21st century"
    const arabicCentury = normalized.match(/\b(\d{1,2})(?:er|e|eme|eme|st|nd|rd|th)?\s*(?:siecle|century)\b/i);
    if (arabicCentury) {
        const c = parseInt(arabicCentury[1], 10);
        return calcCenturyVal(c);
    }

    const romanCentury = normalized.match(/\b([mdclxvi]+)(?:er|e|eme|st|nd|rd|th)?\s*(?:siecle|century)\b/i);
    if (romanCentury && isValidRoman(romanCentury[1])) {
        const c = romanToInt(romanCentury[1]);
        return calcCenturyVal(c);
    }

    // 2) Explicit year digits (e.g. 2025)
    const matchDigit = text.match(/\d+/);
    if (matchDigit) {
        let val = parseInt(matchDigit[0], 10);
        if (isBc) val = -Math.abs(val);
        return val;
    }

    // 3) Standalone roman tokens fallback — FIX 5 : on vérifie la validité avant d'utiliser
    const matchRoman = text.match(/\b[mdclxvi]+\b/i);
    if (matchRoman && isValidRoman(matchRoman[0])) {
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
    // FIX 6 : normaliser les caractères accentués (ème → eme) pour fiabiliser les regex
    let val = String(yearStr).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isEn = lang && lang.startsWith('en');

    if (isEn) {
        // FIX 1 : BC/AD en premier, avant tout autre remplacement
        val = val.replace(/(av|avant)\.?\s*J\.?-?C\.?/gi, 'BC');
        val = val.replace(/(ap|apres|apres)\.?\s*J\.?-?C\.?/gi, 'AD');

        // ── Qualificatifs temporels FR → EN ──────────────────────────
        val = val.replace(/\b(?:vers\s+le|vers\s+la|vers\s+l[''']?|vers)\b/gi, 'c.');
        val = val.replace(/\benviron\b/gi, 'c.');
        // FIX 2 : dédoublage c. placé juste après toutes les sources possibles
        val = val.replace(/\bc\.\s+c\./gi, 'c.');
        val = val.replace(/\b(?:debut\s+du|debut\s+de\s+la|debut\s+de\s+l[''']?|debut)\b/gi, 'early');
        val = val.replace(/\b(?:fin\s+du|fin\s+de\s+la|fin\s+de\s+l[''']?|fin)\b/gi, 'late');
        val = val.replace(/\b(?:milieu\s+du|milieu\s+de\s+la|milieu\s+de\s+l[''']?|milieu)\b/gi, 'mid-');

        // ── Plages avec chiffres romains + siècle(s) en fin de groupe ──
        val = val.replace(
            /\b([MDCLXVI]+)(?:er|e|eme)?(?=\s*(?:au|et|a|a la|[-\u2013\u2014])\s*(?:[MDCLXVI]+|\d+)(?:er|e|eme)?\s*si[ee]cles?)\b/gi,
            (_, roman) => {
                const n = romanToInt(roman.toUpperCase());
                if (!n) return _;
                return `${n}${enOrdinal(n)}`;
            }
        );
        val = val.replace(
            /\b(\d+)(?:er|e|eme)?(?=\s*(?:au|et|a|a la|[-\u2013\u2014])\s*(?:[MDCLXVI]+|\d+)(?:er|e|eme)?\s*si[ee]cles?)\b/gi,
            (_, num) => {
                const n = parseInt(num, 10);
                return `${n}${enOrdinal(n)}`;
            }
        );

        // ── Siècles chiffres romains FR → EN ──────────────────────────
        val = val.replace(
            /\b([MDCLXVI]+)(?:er|e|eme)?\s*si[ee]cles?\b/gi,
            (_, roman) => {
                const n = romanToInt(roman.toUpperCase());
                if (!n) return _;
                return `${n}${enOrdinal(n)} century`;
            }
        );

        // ── Siècles chiffres arabes FR → EN ───────────────────────────
        val = val.replace(
            /\b(\d+)(?:er|e|eme)?\s*si[ee]cles?\b/gi,
            (_, n) => {
                const num = parseInt(n, 10);
                return `${num}${enOrdinal(num)} century`;
            }
        );

        // ── Pluriel "centuries" pour les ordinaux consécutifs ─────────
        val = val.replace(
            /\b((\d+(?:st|nd|rd|th)\s+(?:to|and|[-\u2013\u2014])\s+)+\d+(?:st|nd|rd|th))\s+century\b/gi,
            '$1 centuries'
        );

    } else {
        // FIX 1 : BC/AD en premier, avant le remplacement de "c." → "vers"
        val = val.replace(/\bB\.?C\.?\b/gi, 'av. J.-C.');
        val = val.replace(/\bA\.?D\.?\b/gi, 'ap. J.-C.');

        // ── Qualificatifs temporels EN → FR ──────────────────────────
        // Pas de flag `i` : sans ça, le "C." dans "av. J.-C." (produit juste
        // au-dessus par le remplacement BC→av. J.-C.) serait réécrit en
        // "av. J.-vers". On ne cible donc que le "c." minuscule (circa).
        val = val.replace(/\bc\./g, 'vers');
        val = val.replace(/\bearly\b/gi, 'Début');
        val = val.replace(/\blate\b/gi, 'Fin');
        val = val.replace(/\bmid-?\b/gi, 'Milieu');

        // ── Siècles anglais → FR ──────────────────────────────────────
        val = val.replace(
            /\b(\d+)(?:st|nd|rd|th)?\s*centur(?:y|ies)\b/gi,
            (_, n) => {
                const num = parseInt(n, 10);
                return `${num}${frOrdinal(num)} siècle`;
            }
        );
    }

    return val;
};