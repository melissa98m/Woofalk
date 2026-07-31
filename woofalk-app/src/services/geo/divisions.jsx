import { useRef, useState } from "react";
import axios from "axios";

// geo.api.gouv.fr: the French government's free, keyless "Découpage
// administratif" API — départements/régions names+codes here, communes (for
// resolveDivisionCenter below) elsewhere.
const GEO_API = "https://geo.api.gouv.fr";

// Shared across every <DivisionSearchField/> instance mounted at once, same
// caching rationale as useSearchIndex: the full département+région list
// (~120 rows) is cheap and doesn't change during a session.
let cachedDivisionsPromise = null;

// Third-party API responding with `Access-Control-Allow-Origin: *`, which
// browsers reject when combined with credentials — the
// axios.defaults.withCredentials=true set for the Woofalk API (see
// index.jsx) must not leak onto requests to this one.
const NO_CREDENTIALS = { withCredentials: false };

function loadDivisions() {
    if (!cachedDivisionsPromise) {
        cachedDivisionsPromise = Promise.all([
            axios.get(`${GEO_API}/departements`, { params: { fields: "nom,code" }, ...NO_CREDENTIALS }),
            axios.get(`${GEO_API}/regions`, { params: { fields: "nom,code" }, ...NO_CREDENTIALS }),
        ]).then(([departementsRes, regionsRes]) => [
            ...departementsRes.data.map((d) => ({ type: "departement", code: d.code, label: `${d.nom} (${d.code})` })),
            ...regionsRes.data.map((r) => ({ type: "region", code: r.code, label: r.nom })),
        ]).catch((err) => {
            cachedDivisionsPromise = null; // allow a retry on the next call
            throw err;
        });
    }
    return cachedDivisionsPromise;
}

export function useDivisionsList() {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);
    const requestedRef = useRef(false);

    const ensureLoaded = () => {
        if (requestedRef.current) return;
        requestedRef.current = true;
        setLoading(true);
        loadDivisions()
            .then(setDivisions)
            .catch(() => { requestedRef.current = false; })
            .finally(() => setLoading(false));
    };

    return { divisions, loading, ensureLoaded };
}

/**
 * A département/région has no single official "center" exposed by this API
 * (no centroid, no boundary geometry, no chef-lieu reference on this
 * endpoint) — so we approximate one with its largest commune by population,
 * which in practice is almost always the prefecture/regional capital.
 * Resolved in two requests (names+population first, then just that one
 * commune's point) rather than one, since a région can have 4000+ communes
 * and downloading every one's coordinates just to keep a single winner would
 * be wasteful.
 */
export async function resolveDivisionCenter(division) {
    const param = division.type === "departement" ? "codeDepartement" : "codeRegion";
    const { data: communes } = await axios.get(`${GEO_API}/communes`, {
        params: { [param]: division.code, fields: "nom,population" },
        ...NO_CREDENTIALS,
    });

    const largest = communes.reduce((best, c) => ((c.population ?? 0) > (best?.population ?? 0) ? c : best), null);
    if (!largest) {
        return null;
    }

    const { data: withCenter } = await axios.get(`${GEO_API}/communes/${largest.code}`, {
        params: { fields: "nom,centre" },
        ...NO_CREDENTIALS,
    });

    return {
        label: `${division.label} (près de ${withCenter.nom})`,
        latitude: withCenter.centre.coordinates[1],
        longitude: withCenter.centre.coordinates[0],
    };
}
