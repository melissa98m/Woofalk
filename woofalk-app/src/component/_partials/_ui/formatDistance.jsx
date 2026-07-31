// Ballade distances can be fractional (e.g. 8.4 km) — displayed with a comma
// (French decimal convention) rather than the raw dot from the API/JS number.
export function formatDistance(distanceKm) {
    if (distanceKm == null) {
        return null;
    }
    return `${Number(distanceKm).toLocaleString("fr-FR")} km`;
}

export default formatDistance;
