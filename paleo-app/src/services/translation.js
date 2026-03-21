
export const translationService = {
    translateCartel: async (cartelData, apiKey, targetLang = 'en') => {
        if (!apiKey) throw new Error("API Key missing");

        // Détection du provider basé sur le format de la clé
        if (apiKey.startsWith('sk-')) {
            return translateWithOpenAI(cartelData, apiKey, targetLang);
        } else if (apiKey.endsWith(':fx') || apiKey.length > 20) {
            // :fx = DeepL Free, sinon on suppose DeepL Pro
            return translateWithDeepL(cartelData, apiKey, targetLang);
        } else {
            throw new Error("Format de clé API non reconnu (ni OpenAI sk-..., ni DeepL)");
        }
    }
};

const translateWithOpenAI = async (cartelData, apiKey, targetLang) => {
    const isEnglishTarget = targetLang === 'en';
    const sourceLangName = isEnglishTarget ? 'French' : 'English';
    const targetLangName = isEnglishTarget ? 'English' : 'French';

    const dataToTranslate = {
        title: isEnglishTarget ? cartelData.titre : cartelData.titre_en,
        description: isEnglishTarget ? cartelData.description : cartelData.description_en,
        location: isEnglishTarget ? cartelData.location : cartelData.location_en, // Add location
        categories: cartelData.categories || []
    };

    const prompt = `You are a professional translator for a scientific exhibition about energy called "Paleo-Energetique".
Translate the following JSON content from ${sourceLangName} to ${targetLangName}. 
Return ONLY the translated JSON strictly following the same structure.
If a value is empty, keep it empty.

JSON to translate:
${JSON.stringify(dataToTranslate)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant that translates JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error("OpenAI Error: " + (errData.error?.message || response.statusText));
        }

        const data = await response.json();
        // ... rest of processing ...
        const content = data.choices[0].message.content;
        try {
            const parsed = JSON.parse(content);
            return {
                auth_key: '', // SERVER-SIDE SECURITY: Key is loaded by proxy
                title: parsed.title,
                description: parsed.description,
                location: parsed.location,
                categories: parsed.categories
            };
        } catch (e) {
            console.error(e);
            throw new Error("OpenAI response parsing failed");
        }

    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }

    if (!response.ok) {
        const errData = await response.json();
        throw new Error("OpenAI Error: " + (errData.error?.message || response.statusText));
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
        const parsed = JSON.parse(content);
        return {
            title: parsed.title,
            description: parsed.description,
            location: parsed.location, // Return location
            categories: parsed.categories
        };
    } catch (e) {
        console.error(e);
        throw new Error("OpenAI response parsing failed");
    }
};

const translateWithDeepL = async (cartelData, apiKey, targetLang) => {
    const isFree = apiKey.endsWith(':fx');

    const target = targetLang.toUpperCase();
    const targetParam = target === 'EN' ? 'EN-US' : target;

    const title = (targetLang === 'en' ? cartelData.titre : cartelData.titre_en) || "";
    const desc = (targetLang === 'en' ? cartelData.description : cartelData.description_en) || "";
    const loc = (targetLang === 'en' ? cartelData.location : cartelData.location_en) || "";
    const categories = cartelData.categories || [];

    const hasTitle = !!title;
    const hasDesc = !!desc;
    const hasLoc = !!loc;

    let textsToTranslate = [];
    if (hasTitle) textsToTranslate.push(title);
    if (hasDesc) textsToTranslate.push(desc);
    if (hasLoc) textsToTranslate.push(loc);
    categories.forEach(c => textsToTranslate.push(c));

    if (textsToTranslate.length === 0) return { title: "", description: "", location: "", categories: [] };


    // Determine Environment
    // CRITICAL FIX: Do not rely on hostname. 
    // If running "npm run build" output on localhost, we MUST use PHP proxy, because Vite Dev Server is gone.
    const useViteProxy = import.meta.env.DEV;

    let url;
    let headers = {
        'Content-Type': 'application/json'
    };
    let bodyPayload = {
        text: textsToTranslate,
        target_lang: targetParam
    };

    if (useViteProxy) {
        // USE VITE PROXY (Dev)
        url = isFree ? '/api/deepl/free/translate' : '/api/deepl/pro/translate';
        headers['Authorization'] = `DeepL-Auth-Key ${apiKey}`;
    } else {
        // USE PHP PROXY (Prod)
        url = './api/proxy_deepl.php';
        // PHP Proxy expects key in body
        bodyPayload.auth_key = apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(bodyPayload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text().catch(() => "Unknown network error");
            throw new Error("DeepL Error: " + errText);
        }

        const data = await response.json();
        const translations = data.translations;

        let output = {
            title: "",
            description: "",
            location: "",
            categories: []
        };

        let cursor = 0;
        if (hasTitle) output.title = translations[cursor++].text;
        if (hasDesc) output.description = translations[cursor++].text;
        if (hasLoc) output.location = translations[cursor++].text;

        while (cursor < translations.length) {
            output.categories.push(translations[cursor++].text);
        }

        return output;

    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
};
