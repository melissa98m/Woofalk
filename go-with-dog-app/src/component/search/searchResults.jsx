import { useEffect, useMemo } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useSearchIndex, normalizeText } from "../../services/search/searchIndex";
import { PlaceCard } from "../_partials/_ui/PlaceCard";
import { BalladeCard } from "../_partials/_ui/BalladeCard";

const GRID_SX = {
    display: "grid",
    gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
    gap: { xs: "16px", md: "22px" },
};

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") ?? "";
    const { index, loading, ensureLoaded } = useSearchIndex();

    useEffect(() => {
        ensureLoaded();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    document.title = query ? `Résultats pour « ${query} »` : "Recherche";

    const q = normalizeText(query);
    const hasQuery = query.trim().length > 0;

    const places = useMemo(() => {
        if (q.length < 2) return [];
        return (index.places ?? []).filter((place) =>
            normalizeText([place.place_name, place.category?.category_name, place.address?.city].filter(Boolean).join(" ")).includes(q)
        );
    }, [index.places, q]);

    const ballades = useMemo(() => {
        if (q.length < 2) return [];
        return (index.ballades ?? []).filter((ballade) => normalizeText(ballade.ballade_name).includes(q));
    }, [index.ballades, q]);

    const total = places.length + ballades.length;

    return (
        <Container maxWidth="xl" id="search-results" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>
            <Box sx={{ marginTop: "20px", marginBottom: "24px" }}>
                <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>
                    Résultats de recherche
                </Typography>
                <Typography variant="body2" color="text.secondary" role="status" aria-live="polite">
                    {loading
                        ? "Recherche en cours…"
                        : hasQuery
                        ? `${total} résultat${total > 1 ? "s" : ""} pour « ${query} »`
                        : "Saisissez un terme de recherche."}
                </Typography>
            </Box>

            {!loading && hasQuery && total === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    Aucun lieu ni balade ne correspond à votre recherche.
                </Typography>
            ) : null}

            {places.length > 0 ? (
                <Box component="section" aria-labelledby="search-places-heading" sx={{ marginBottom: "36px" }}>
                    <Typography id="search-places-heading" variant="h2" sx={{ fontSize: "20px", marginBottom: "16px" }}>
                        Lieux ({places.length})
                    </Typography>
                    <Box sx={GRID_SX}>
                        {places.map((place) => <PlaceCard key={place.id} place={place} />)}
                    </Box>
                </Box>
            ) : null}

            {ballades.length > 0 ? (
                <Box component="section" aria-labelledby="search-ballades-heading">
                    <Typography id="search-ballades-heading" variant="h2" sx={{ fontSize: "20px", marginBottom: "16px" }}>
                        Balades ({ballades.length})
                    </Typography>
                    <Box sx={GRID_SX}>
                        {ballades.map((ballade) => <BalladeCard key={ballade.id} ballade={ballade} />)}
                    </Box>
                </Box>
            ) : null}
        </Container>
    );
}

export default SearchResults;
