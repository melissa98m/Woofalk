import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Card,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";
import { StatCard } from "../_partials/_ui/StatCard";
import { StatusChip } from "../_partials/_ui/StatusChip";
import EditPlace from "../place/editPlace";
import DeletePlace from "../place/deletePlace";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function Dashboard() {

    document.title = "Tableau de bord";

    const [places, setPlaces] = useState(null);
    const [ballades, setBallades] = useState(null);
    const [users, setUsers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/places`),
            axios.get(`${API_URL}/api/ballades`),
            axios.get(`${API_URL}/api/users`, {
                headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
            }),
        ]).then(([placesRes, balladesRes, usersRes]) => {
            setPlaces(placesRes.data.data);
            setBallades(balladesRes.data.data);
            setUsers(usersRes.data.data);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const handlePlacesChange = async (dataChange) => {
        setPlaces(dataChange);
    };

    const stats = useMemo(() => {
        const now = Date.now();
        return [
            { label: "Lieux actifs", value: places ? places.filter((p) => (p.status ?? "publie") === "publie").length : "…" },
            { label: "Balades publiées", value: ballades ? ballades.filter((b) => (b.status ?? "publie") === "publie").length : "…" },
            { label: "Nouveaux utilisateurs (7j)", value: users ? users.filter((u) => u.created_at && (now - new Date(u.created_at).getTime()) <= SEVEN_DAYS_MS).length : "…" },
            { label: "Signalements en attente", value: (places && ballades) ? places.filter((p) => p.status === "en_attente").length + ballades.filter((b) => b.status === "en_attente").length : "…" },
        ];
    }, [places, ballades, users]);

    const latestPlaces = useMemo(() => {
        if (!places) return [];
        return [...places]
            .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
            .filter((p) => p.place_name.toLowerCase().includes(search.trim().toLowerCase()))
            .slice(0, 5);
    }, [places, search]);

    return (
        <Box id="dashboard">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", mb: "28px" }}>
                <Typography variant="h1" sx={{ fontSize: "26px", m: 0 }}>Tableau de bord</Typography>
                <TextField
                    size="small"
                    placeholder="Rechercher un lieu…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 280 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="disabled" />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { "aria-label": "Rechercher un lieu par nom" },
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    mb: "28px",
                }}
            >
                {stats.map((s) => (
                    <StatCard key={s.label} label={s.label} value={s.value} />
                ))}
            </Box>

            <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
                <Box sx={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    px: "20px", py: "16px", borderBottom: "1px solid", borderColor: "divider",
                }}>
                    <Typography component="h2" sx={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "16px", m: 0 }}>
                        Derniers lieux ajoutés
                    </Typography>
                    <Typography component={Link} to="/place" sx={{ fontSize: "13px", fontWeight: 700, color: "sageDark", textDecoration: "none" }}>
                        Voir tous les lieux
                    </Typography>
                </Box>
                {loading ? (
                    <Typography role="status" aria-live="polite" color="text.secondary" sx={{ p: "20px" }}>Chargement…</Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nom</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Catégorie</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {latestPlaces.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: "center", color: "text.secondary" }}>Aucun lieu trouvé</TableCell>
                                </TableRow>
                            ) : latestPlaces.map(({id, place_name, place_description, place_image, status, category, address, tags, user, created_at}) => (
                                <TableRow hover key={id}>
                                    <TableCell sx={{ fontWeight: "bold" }}>{place_name ?? "--"}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{category?.category_name ?? "--"}</TableCell>
                                    <TableCell><StatusChip status={status ?? "publie"} /></TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontSize: "13px", display: { xs: 'none', sm: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : "--"}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", justifyContent: "right" }}>
                                            <EditPlace updateValue={{id, place_name, place_description, place_image, status, category, address, tags, data: places}} handleDataChange={handlePlacesChange} />
                                            <DeletePlace deleteValue={{id, place_name, place_description, place_image, category, address, data: places}} handleDataChange={handlePlacesChange} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </Box>
    );
}

export default Dashboard;
