
export const geocodingService = {
    search: async (query) => {
        if (!query || query.length < 3) return null;

        try {
            const encoded = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'PaleoApp/1.0' // Required by OSM policy
                }
            });

            if (!response.ok) throw new Error("Geocoding failed");

            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon), // OSM returns 'lon'
                    display_name: data[0].display_name
                };
            }
            return null;
        } catch (e) {
            console.error("Geocoding error:", e);
            return null;
        }
    }
};
