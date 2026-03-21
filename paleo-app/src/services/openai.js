
export const openaiService = {
    translateCartel: async (cartelData, apiKey, targetLang = 'en') => {
        if (!apiKey) throw new Error("API Key missing");

        const isEnglishTarget = targetLang === 'en';
        const sourceLangName = isEnglishTarget ? 'French' : 'English';
        const targetLangName = isEnglishTarget ? 'English' : 'French';

        // Construit le prompt
        // On envoie un JSON partiel
        const dataToTranslate = {
            title: isEnglishTarget ? cartelData.titre : cartelData.titre_en,
            description: isEnglishTarget ? cartelData.description : cartelData.description_en,
            categories: cartelData.categories || []
        };

        const prompt = `You are a professional translator for a scientific exhibition about energy called "Paleo-Energetique".
Translate the following JSON content from ${sourceLangName} to ${targetLangName}. 
Return ONLY the translated JSON strictly following the same structure. Do not add any markdown formatting or explanations.
If a value is empty, keep it empty.
For categories, keep them short and consistent with standard energy terms.
        
JSON to translate:
${JSON.stringify(dataToTranslate)}`;

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
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "OpenAI API Error");
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parse result
            try {
                const parsed = JSON.parse(content);
                return {
                    title: parsed.title,
                    description: parsed.description,
                    categories: parsed.categories
                };
            } catch (jsonErr) {
                console.error("Failed to parse OpenAI response", content);
                throw new Error("Invalid response format from translation service");
            }

        } catch (error) {
            console.error("Translation error:", error);
            throw error;
        }
    }
};
