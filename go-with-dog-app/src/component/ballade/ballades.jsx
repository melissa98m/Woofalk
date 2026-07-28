import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    Typography,
    MenuItem , Select ,InputLabel,
    Pagination
} from "@mui/material";
import { Link } from "react-router-dom";

import axios from "axios";
import auth from "../../services/auth/token";
import { BalladeCard } from "../_partials/_ui/BalladeCard";
import { API_URL } from "../../config";

const PAGE_SIZE = 9;

function Ballades() {

    document.title = 'Toutes les balades';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortOrder, setSortOrder] = useState("");
    const [page, setPage] = useState(1);




    useEffect(() => {
        axios.get(`${API_URL}/api/ballades`).then((actualData) => {
            actualData = actualData.data;
            setLoading(true)
            setData(actualData.data);
            setError(null);
        }).catch((err) => {
            setError(err.message);
            setData(null);
        }).finally(() => {
            setLoading(false);
        });
        axios.get(`${API_URL}/api/tags`).then((res) => setAvailableTags(res.data.data));
    }, []);

    const toggleTag = (tagId) => {
        setSelectedTags((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
        setPage(1);
    };

    const firstTagName = (ballade) => (ballade.tags ?? []).length > 0
        ? [...ballade.tags].map((t) => t.tag_name).sort()[0]
        : null;

    const filteredData = useMemo(() => {
        let result = data?.filter((ballade) => {
            if (selectedTags.length > 0) {
                const balladeTagIds = (ballade.tags ?? []).map((t) => t.id);
                if (!selectedTags.every((id) => balladeTagIds.includes(id))) {
                    return false;
                }
            }
            return true;
        }) ?? [];
        if (sortOrder === "nom-asc") {
            result = [...result].sort((a, b) => a.ballade_name.localeCompare(b.ballade_name));
        } else if (sortOrder === "nom-desc") {
            result = [...result].sort((a, b) => b.ballade_name.localeCompare(a.ballade_name));
        } else if (sortOrder === "distance-asc") {
            result = [...result].sort((a, b) => a.distance - b.distance);
        } else if (sortOrder === "denivele-asc") {
            result = [...result].sort((a, b) => a.denivele - b.denivele);
        } else if (sortOrder === "tags-asc") {
            result = [...result].sort((a, b) => {
                const ta = firstTagName(a);
                const tb = firstTagName(b);
                if (!ta && !tb) return 0;
                if (!ta) return 1;
                if (!tb) return -1;
                return ta.localeCompare(tb);
            });
        }
        return result;
    }, [data, selectedTags, sortOrder]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
    const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    return <Container maxWidth="xl" id="ballade" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginTop: "20px", marginBottom: "6px" }}>
                <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Balades autorisées aux chiens</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data ? `${data.length} balade${data.length > 1 ? "s" : ""} référencée${data.length > 1 ? "s" : ""}` : "…"}
                    </Typography>
                </Box>
                {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
                    <Button component={Link} to="/ballades/new" variant="contained">Ajouter une balade</Button>
                ) : null}
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginTop: "18px",
                    marginBottom: "24px",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: { md: "auto" } }}>
                    <InputLabel id="ballade-sort-label" sx={{ whiteSpace: "nowrap" }}>Trier par :</InputLabel>
                    <Select
                        labelId="ballade-sort-label"
                        value={sortOrder}
                        onChange={handleFilterChange(setSortOrder)}
                        size="small"
                    >
                        <MenuItem value="">Par défaut</MenuItem>
                        <MenuItem value="nom-asc">Nom (A → Z)</MenuItem>
                        <MenuItem value="nom-desc">Nom (Z → A)</MenuItem>
                        <MenuItem value="distance-asc">Distance croissante</MenuItem>
                        <MenuItem value="denivele-asc">Dénivelé croissant</MenuItem>
                        <MenuItem value="tags-asc">Tags (A → Z)</MenuItem>
                    </Select>
                </Box>
            </Box>

            {availableTags.length > 0 ? (
                <Box
                    role="group"
                    aria-label="Filtrer par tags"
                    sx={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}
                >
                    {availableTags.map((t) => {
                        const selected = selectedTags.includes(t.id);
                        return (
                            <Chip
                                key={t.id}
                                label={`#${t.tag_name}`}
                                size="small"
                                clickable
                                onClick={() => toggleTag(t.id)}
                                color={selected ? "primary" : "default"}
                                variant={selected ? "filled" : "outlined"}
                                aria-pressed={selected}
                            />
                        );
                    })}
                </Box>
            ) : null}

            {loading ? (
                <Typography role="status" aria-live="polite" variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des balades...</Typography>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                            gap: { xs: "16px", md: "22px" },
                            marginBottom: "36px",
                        }}
                    >
                        {pagedData.map((ballade) => (
                            <BalladeCard key={ballade.id} ballade={ballade} />
                        ))}
                    </Box>
                    {pageCount > 1 ? (
                        <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                            <Pagination
                                count={pageCount}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                shape="circular"
                                color="primary"
                                aria-label="Pagination des balades"
                            />
                        </Box>
                    ) : null}
                </>
            )}


    </Container>
}

export default Ballades;
