import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Container, IconButton, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { PlaceCard } from "../_partials/_ui/PlaceCard";
import { BalladeCard } from "../_partials/_ui/BalladeCard";
import { API_URL } from "../../config";

const QUICK_CATEGORIES = ["Restaurant", "Parc", "Hebergement", "Autre"];

function Home() {

    document.title = "Page d'accueil";

    const [ballades, setBallades] = useState([]);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/ballades`),
            axios.get(`${API_URL}/api/places`),
        ]).then(([balladesRes, placesRes]) => {
            setBallades(balladesRes.data.data);
            setPlaces(placesRes.data.data);
            setError(null);
        }).catch((err) => {
            setError(err.message);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return <Container maxWidth="lg" id='home' sx={{ pb: "40px", px: { xs: 2, md: 4 } }}>
        <Box
            sx={{
                bgcolor: "sageSoft",
                borderRadius: "20px",
                padding: { xs: "24px 20px", sm: "32px 24px", md: "56px 48px" },
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
            }}
        >
            <Box sx={{ maxWidth: "640px", textAlign: "left" }}>
                <Typography variant="h1" sx={{ fontSize: { xs: "28px", md: "40px" } }} gutterBottom>
                    Trouvez le coin parfait pour votre chien
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: "16px", marginBottom: "24px" }}>
                    Parcs, plages, forêts et balades vérifiés par des propriétaires de chiens, partout en France.
                </Typography>

                <Box
                    component="form"
                    role="search"
                    aria-label="Recherche principale"
                    onSubmit={(e) => e.preventDefault()}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: "4px", sm: "8px" },
                        width: "100%",
                        maxWidth: "480px",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "999px",
                        padding: { xs: "4px 4px 4px 12px", sm: "6px 6px 6px 16px" },
                    }}
                >
                    <IconButton type="submit" aria-label="Rechercher" size="small">
                        <SearchIcon fontSize="small" />
                    </IconButton>
                    <InputBase
                        placeholder="Rechercher une ville, un lieu…"
                        inputProps={{ "aria-label": "Rechercher une ville ou un lieu" }}
                        sx={{ flex: 1, minWidth: 0, fontFamily: "'Nunito', sans-serif", fontSize: "14px" }}
                    />
                    <Button type="submit" variant="contained" sx={{ padding: { xs: "8px 14px", sm: "10px 20px" }, fontSize: { xs: "13px", sm: "14px" }, flexShrink: 0 }}>Chercher</Button>
                </Box>

                <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
                    {QUICK_CATEGORIES.map((category) => (
                        <Chip key={category} label={category} sx={{ bgcolor: "background.paper", color: "sageDark", fontWeight: 700 }} />
                    ))}
                </Box>
            </Box>
        </Box>

        {loading ? (
            <Typography role="status" aria-live="polite" sx={{textAlign: "center", marginTop: "40px"}} gutterBottom>Chargement...</Typography>
        ) : (
            <>
                <Typography variant="h2" sx={{ marginTop: { xs: "28px", md: "40px" }, marginBottom: "20px" }} gutterBottom>Lieux près de chez vous</Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: { xs: "16px", md: "22px" },
                        marginBottom: { xs: "28px", md: "40px" },
                    }}
                >
                    {places.slice(0, 3).map((place) => (
                        <PlaceCard key={place.id} place={place} />
                    ))}
                </Box>

                <Typography variant="h2" sx={{ marginBottom: "20px" }} gutterBottom>Idées de balades</Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: { xs: "16px", md: "22px" },
                    }}
                >
                    {ballades.slice(0, 3).map((ballade) => (
                        <BalladeCard key={ballade.id} ballade={ballade} />
                    ))}
                </Box>
            </>
        )}
    </Container>

}
export default Home;
