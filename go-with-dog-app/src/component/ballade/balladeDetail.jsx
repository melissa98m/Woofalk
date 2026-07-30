import { useEffect, useState } from "react";
import { Box, Breadcrumbs, Chip, Container, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import marker from "../../assets/icon.svg";
import { DetailStat } from "../_partials/_ui/DetailStat";
import { LikeButton } from "../_partials/_ui/LikeButton";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { API_URL } from "../../config";

const myIcon = new Icon({ iconUrl: marker, iconSize: [32, 32] });

function BalladeDetail() {
    const { id } = useParams();
    const [ballade, setBallade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [like, setLike] = useState({ liked: false, count: 0 });

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/ballades/${id}`)
            .then((res) => {
                setBallade(res.data);
                setLike({ liked: !!res.data.is_liked, count: res.data.likes_count ?? 0 });
            })
            .catch(() => setError("Balade introuvable."))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        document.title = ballade ? ballade.ballade_name : "Balade";
    }, [ballade]);

    if (loading) {
        return <Container maxWidth="md" sx={{ py: "60px" }}>
            <Typography role="status" aria-live="polite" sx={{ textAlign: "center" }}>Chargement...</Typography>
        </Container>;
    }

    if (error || !ballade) {
        return <Container maxWidth="md" sx={{ py: "60px" }}>
            <Typography role="alert" sx={{ textAlign: "center" }}>{error ?? "Balade introuvable."}</Typography>
        </Container>;
    }

    const { ballade_name, ballade_description, ballade_image, tags, ballade_latitude, ballade_longitude, denivele, distance } = ballade;

    return <Container maxWidth="xl" id="ballade-detail" sx={{ px: { xs: 1, sm: 1.5, md: 2 }, py: { xs: "24px", md: "32px" }, pb: "80px" }}>
        <Breadcrumbs aria-label="Fil d'ariane" sx={{ marginBottom: "16px", fontSize: "13px" }}>
            <Typography component={Link} to="/ballades" color="text.secondary" sx={{ textDecoration: "none", fontSize: "13px" }}>Balades</Typography>
            <Typography color="text.primary" sx={{ fontSize: "13px" }}>{ballade_name}</Typography>
        </Breadcrumbs>

        <Box
            component="img"
            src={`${API_URL}/storage/uploads/ballades/${ballade_image}`}
            alt={ballade_name}
            sx={{ width: "100%", height: { xs: "220px", md: "320px" }, objectFit: "cover", borderRadius: "24px", marginBottom: "24px" }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <Box>
                <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "32px" }, marginBottom: "8px" }}>{ballade_name}</Typography>
                {tags && tags.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
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
            <LikeButton
                type="ballades"
                id={id}
                liked={like.liked}
                likesCount={like.count}
                onChange={({ liked, likesCount }) => setLike({ liked, count: likesCount })}
            />
        </Box>

        <Box sx={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "32px" }}>
            <DetailStat dotColor="sageDark" value={`${distance} km`} label="Distance" />
            <DetailStat dotColor="terracottaDark" value={`+${denivele} m`} label="Dénivelé" />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gap: "32px" }}>
            <Box>
                <Typography variant="h2" sx={{ fontSize: "20px", marginBottom: "12px" }}>Description</Typography>
                <Typography variant="body1" sx={{ fontSize: "15px", lineHeight: 1.7 }}>{ballade_description}</Typography>
            </Box>
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column" }}>
                <Typography variant="h3" sx={{ fontSize: "16px", marginBottom: "14px" }}>Infos pratiques</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "16px" }}>
                    <div><strong>Distance :</strong> {distance} km</div>
                    <div><strong>Dénivelé :</strong> +{denivele} m</div>
                    {tags && tags.length > 0 ? <div><strong>Tags :</strong> {tags.map((t) => t.tag_name).join(", ")}</div> : null}
                </Box>
                <Box
                    role="img"
                    aria-label={`Carte de localisation de la balade ${ballade_name}`}
                    sx={{ borderRadius: "14px", overflow: "hidden", flexGrow: 1, minHeight: "220px", "& .leaflet-container": { height: "100%", width: "100%" } }}
                >
                    <MapContainer center={[ballade_latitude, ballade_longitude]} zoom={12} scrollWheelZoom={false}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[ballade_latitude, ballade_longitude]} icon={myIcon}>
                            <Popup>{ballade_name}</Popup>
                        </Marker>
                    </MapContainer>
                </Box>
            </Box>
        </Box>
    </Container>;
}

export default BalladeDetail;
