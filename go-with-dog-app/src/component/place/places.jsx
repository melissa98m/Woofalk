import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    Typography,
    Select , MenuItem , InputLabel,
    Pagination
} from "@mui/material";
import { Link } from "react-router-dom";

import axios from "axios";
import auth from "../../services/auth/token";
import NewAddress from "../address/newAddress";
import { PlaceCard } from "../_partials/_ui/PlaceCard";
import { API_URL } from "../../config";

const PAGE_SIZE = 9;

function Places() {

    document.title = 'Tous les lieux';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortOrder, setSortOrder] = useState("");
    const [page, setPage] = useState(1);



    useEffect(() => {
        axios.get(`${API_URL}/api/places`).then((actualData) => {
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

    const handleDataChange = async (dataChange) => {
        await setData(dataChange)
    }

    const toggleTag = (tagId) => {
        setSelectedTags((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
        setPage(1);
    };

    const firstTagName = (place) => (place.tags ?? []).length > 0
        ? [...place.tags].map((t) => t.tag_name).sort()[0]
        : null;

    const filteredData = useMemo(() => {
        let result = data?.filter((place) => {
            if (selectedCategory && place.category.category_name !== selectedCategory) {
                return false;
            }
            if (selectedTags.length > 0) {
                const placeTagIds = (place.tags ?? []).map((t) => t.id);
                if (!selectedTags.every((id) => placeTagIds.includes(id))) {
                    return false;
                }
            }
            return true;
        }) ?? [];
        if (sortOrder === "nom-asc") {
            result = [...result].sort((a, b) => a.place_name.localeCompare(b.place_name));
        } else if (sortOrder === "nom-desc") {
            result = [...result].sort((a, b) => b.place_name.localeCompare(a.place_name));
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
    }, [data, selectedCategory, selectedTags, sortOrder]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
    const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    return <Container maxWidth="xl" id="place" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginTop: "20px", marginBottom: "6px" }}>
                <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Lieux autorisés aux chiens</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data ? `${data.length} lieu${data.length > 1 ? "x" : ""} référencé${data.length > 1 ? "s" : ""}` : "…"}
                    </Typography>
                </Box>
                {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
                    <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Button component={Link} to="/places/new" variant="contained">Ajouter un lieu</Button>
                        <NewAddress newValue={{data}} handleDataChange={handleDataChange} />
                    </Box>
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
                <InputLabel id="place-category-filter-label" sx={{ whiteSpace: "nowrap" }}>Catégorie :</InputLabel>
                <Select
                    labelId="place-category-filter-label"
                    value={selectedCategory}
                    onChange={handleFilterChange(setSelectedCategory)}
                    size="small"
                >
                    <MenuItem value={null}>Toutes catégories</MenuItem>
                    <MenuItem value="Restaurant">Restaurant</MenuItem>
                    <MenuItem value="Parc">Parc</MenuItem>
                    <MenuItem value="Hebergement">Hebergement</MenuItem>
                    <MenuItem value="Autre">Autre</MenuItem>
                </Select>

                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: { md: "auto" } }}>
                    <InputLabel id="place-sort-label" sx={{ whiteSpace: "nowrap" }}>Trier par :</InputLabel>
                    <Select
                        labelId="place-sort-label"
                        value={sortOrder}
                        onChange={handleFilterChange(setSortOrder)}
                        size="small"
                    >
                        <MenuItem value="">Par défaut</MenuItem>
                        <MenuItem value="nom-asc">Nom (A → Z)</MenuItem>
                        <MenuItem value="nom-desc">Nom (Z → A)</MenuItem>
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
                <Typography role="status" aria-live="polite" variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des lieux...</Typography>
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
                        {pagedData.map((place) => (
                            <PlaceCard key={place.id} place={place} />
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
                                aria-label="Pagination des lieux"
                            />
                        </Box>
                    ) : null}
                </>
            )}


    </Container>
}

export default Places;
