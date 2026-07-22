import { useEffect, useState } from "react";
import { Box, Breadcrumbs, Chip, Container, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import marker from "../../assets/icon.svg";
import { API_URL } from "../../config";

const myIcon = new Icon({ iconUrl: marker, iconSize: [32, 32] });

function PlaceDetail() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/places/${id}`)
            .then((res) => setPlace(res.data))
            .catch(() => setError("Lieu introuvable."))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        document.title = place ? place.place_name : "Lieu";
    }, [place]);

    if (loading) {
        return <Container maxWidth="md" sx={{ py: "60px" }}>
            <Typography role="status" aria-live="polite" sx={{ textAlign: "center" }}>Chargement...</Typography>
        </Container>;
    }

    if (error || !place) {
        return <Container maxWidth="md" sx={{ py: "60px" }}>
            <Typography role="alert" sx={{ textAlign: "center" }}>{error ?? "Lieu introuvable."}</Typography>
        </Container>;
    }

    const { place_name, place_description, place_image, category, address } = place;

    return <Container maxWidth="md" id="place-detail" sx={{ px: { xs: 2, md: 4 }, py: { xs: "24px", md: "32px" }, pb: "80px" }}>
        <Breadcrumbs aria-label="Fil d'ariane" sx={{ marginBottom: "16px", fontSize: "13px" }}>
            <Typography component={Link} to="/places" color="text.secondary" sx={{ textDecoration: "none", fontSize: "13px" }}>Lieux</Typography>
            <Typography color="text.primary" sx={{ fontSize: "13px" }}>{place_name}</Typography>
        </Breadcrumbs>

        <Box
            component="img"
            src={`${API_URL}/storage/uploads/places/${place_image}`}
            alt={place_name}
            sx={{ width: "100%", height: { xs: "220px", md: "320px" }, objectFit: "cover", borderRadius: "24px", marginBottom: "24px" }}
        />

        <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "32px" }, marginBottom: "8px" }}>{place_name}</Typography>
            {category ? (
                <Chip label={category.category_name} sx={{ bgcolor: "sageSoft", color: "sageDark", fontWeight: 700 }} />
            ) : null}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gap: "32px" }}>
            <Box>
                <Typography variant="h2" sx={{ fontSize: "20px", marginBottom: "12px" }}>Description</Typography>
                <Typography variant="body1" sx={{ fontSize: "15px", lineHeight: 1.7 }}>{place_description}</Typography>
            </Box>
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "20px", padding: "20px", height: "fit-content" }}>
                <Typography variant="h3" sx={{ fontSize: "16px", marginBottom: "14px" }}>Infos pratiques</Typography>
                {address ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "16px" }}>
                        <div><strong>Adresse :</strong> {address.address}</div>
                        <div><strong>Ville :</strong> {address.postal_code} {address.city}</div>
                        {category ? <div><strong>Catégorie :</strong> {category.category_name}</div> : null}
                    </Box>
                ) : null}
                {address ? (
                    <Box
                        role="img"
                        aria-label={`Carte de localisation de ${place_name}`}
                        sx={{ borderRadius: "14px", overflow: "hidden", "& .leaflet-container": { height: "220px", width: "100%" } }}
                    >
                        <MapContainer center={[address.latitude, address.longitude]} zoom={14} scrollWheelZoom={false}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[address.latitude, address.longitude]} icon={myIcon}>
                                <Popup>{place_name}<br/>{address.address}</Popup>
                            </Marker>
                        </MapContainer>
                    </Box>
                ) : null}
            </Box>
        </Box>
    </Container>;
}

export default PlaceDetail;
