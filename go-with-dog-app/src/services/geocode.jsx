import axios from "axios";

// The French government's free, keyless "Base Adresse Nationale" API:
// autocompletes real addresses and returns postal code/city/lat/lon in one
// call, so a picked suggestion never needs a separate geocoding round-trip.
const BAN_URL = "https://api-adresse.data.gouv.fr/search/";

export async function searchAddresses(query, limit = 5) {
    if (!query || query.trim().length < 3) {
        return [];
    }

    const res = await axios.get(BAN_URL, {
        params: { q: query, limit, autocomplete: 1 },
    });

    return res.data.features.map((feature) => ({
        label: feature.properties.label,
        address: feature.properties.name || feature.properties.label,
        postal_code: feature.properties.postcode,
        city: feature.properties.city,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
    }));
}

export default searchAddresses;
