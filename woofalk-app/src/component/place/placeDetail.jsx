import { useEffect, useState } from "react";
import { Box, Breadcrumbs, Chip, Container, Typography } from "@mui/material";
import { Language } from "@mui/icons-material";
import { Link, useParams } from "react-router-dom";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import marker from "../../assets/icon.svg";
import { LikeButton } from "../_partials/_ui/LikeButton";
import { API_URL } from "../../config";

const myIcon = new Icon({ iconUrl: marker, iconSize: [32, 32] });

function PlaceDetail() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [like, setLike] = useState({ liked: false, count: 0 });

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/places/${id}`)
            .then((res) => {
                setPlace(res.data);
                setLike({ liked: !!res.data.is_liked, count: res.data.likes_count ?? 0 });
            })
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

    const { place_name, place_description, place_image, place_website, category, address, tags } = place;

    return <Container maxWidth="xl" id="place-detail" sx={{ px: { xs: 1, sm: 1.5, md: 2 }, py: { xs: "24px", md: "32px" }, pb: "80px" }}>
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "32px" }, marginBottom: "8px" }}>{place_name}</Typography>
                <LikeButton
                    type="places"
                    id={id}
                    liked={like.liked}
                    likesCount={like.count}
                    onChange={({ liked, likesCount }) => setLike({ liked, count: likesCount })}
                />
            </Box>
            {category ? (
                <Chip label={category.category_name} sx={{ bgcolor: "sageSoft", color: "sageDark", fontWeight: 700 }} />
            ) : null}
            {tags && tags.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: 1.5 }}>
                    {tags.map((t) => (
                        <Chip
                            key={t.id}
                            size="small"
                            variant="outlined"
                            label={`#${truncateLabel(t.tag_name)}`}
                            title={t.tag_name}
                            sx={{ color: t.color, borderColor: t.color }}
                        />
                    ))}
                </Box>
            ) : null}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gap: "32px" }}>
            <Box>
                <Typography variant="h2" sx={{ fontSize: "20px", marginBottom: "12px" }}>Description</Typography>
                <Typography variant="body1" sx={{ fontSize: "15px", lineHeight: 1.7 }}>{place_description}</Typography>
            </Box>
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column" }}>
                <Typography variant="h3" sx={{ fontSize: "16px", marginBottom: "14px" }}>Infos pratiques</Typography>
                {address ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "16px" }}>
                        <div><strong>Adresse :</strong> {address.address}</div>
                        <div><strong>Ville :</strong> {address.postal_code} {address.city}</div>
                        {category ? <div><strong>Catégorie :</strong> {category.category_name}</div> : null}
                        {place_website ? (
                            <div>
                                <strong>Site web :</strong>{" "}
                                <Typography
                                    component="a"
                                    href={place_website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Visiter le site officiel de ${place_name} (nouvel onglet)`}
                                    sx={{ color: "primary.main", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                    Visiter le site <Language fontSize="inherit" aria-hidden="true" />
                                </Typography>
                            </div>
                        ) : null}
                    </Box>
                ) : null}
                {address ? (
                    <Box
                        role="img"
                        aria-label={`Carte de localisation de ${place_name}`}
                        sx={{ borderRadius: "14px", overflow: "hidden", flexGrow: 1, minHeight: "220px", "& .leaflet-container": { height: "100%", width: "100%" } }}
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
