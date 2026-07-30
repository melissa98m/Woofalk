import { useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

// Shared across every <Search/> instance mounted at once (navbar + drawer)
// so switching between them doesn't refetch the whole catalog.
let cachedIndexPromise = null;

function loadIndex() {
    if (!cachedIndexPromise) {
        cachedIndexPromise = Promise.all([
            axios.get(`${API_URL}/api/places`),
            axios.get(`${API_URL}/api/ballades`),
        ]).then(([placesRes, balladesRes]) => ({
            places: placesRes.data.data ?? [],
            ballades: balladesRes.data.data ?? [],
        })).catch((err) => {
            cachedIndexPromise = null; // allow a retry on the next call
            throw err;
        });
    }
    return cachedIndexPromise;
}

// Loads the catalog lazily (on first focus of a search field, not on mount)
// so pages that never touch search don't pay for it.
export function useSearchIndex() {
    const [index, setIndex] = useState({ places: [], ballades: [] });
    const [loading, setLoading] = useState(false);
    const requestedRef = useRef(false);

    const ensureLoaded = () => {
        if (requestedRef.current) return;
        requestedRef.current = true;
        setLoading(true);
        loadIndex()
            .then(setIndex)
            .catch(() => { requestedRef.current = false; })
            .finally(() => setLoading(false));
    };

    return { index, loading, ensureLoaded };
}

export function normalizeText(value) {
    return (value ?? "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function buildSuggestions(query, index, limitPerType = 5) {
    const q = normalizeText(query);
    if (q.length < 2) return [];

    const places = (index.places ?? [])
        .filter((place) => normalizeText([place.place_name, place.category?.category_name, place.address?.city].filter(Boolean).join(" ")).includes(q))
        .slice(0, limitPerType)
        .map((place) => ({
            type: "place",
            id: place.id,
            label: place.place_name,
            secondary: [place.category?.category_name, place.address?.city].filter(Boolean).join(" · ") || undefined,
            to: `/places/${place.id}`,
        }));

    const ballades = (index.ballades ?? [])
        .filter((ballade) => normalizeText(ballade.ballade_name).includes(q))
        .slice(0, limitPerType)
        .map((ballade) => ({
            type: "ballade",
            id: ballade.id,
            label: ballade.ballade_name,
            secondary: ballade.distance ? `${ballade.distance} km` : undefined,
            to: `/ballades/${ballade.id}`,
        }));

    return [...places, ...ballades];
}
