import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    Typography,
    Select , MenuItem , InputLabel,
    Pagination,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Link, useSearchParams } from "react-router-dom";

import axios from "axios";
import auth from "../../services/auth/token";
import NewAddress from "../address/newAddress";
import { PlaceCard } from "../_partials/_ui/PlaceCard";
import { getReadableTextColor } from "../_partials/_ui/tagColor";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { normalizeText } from "../../services/search/searchIndex";
import { Seo } from "../_partials/_seo/Seo";
import { API_URL } from "../../config";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const MAX_VISIBLE_FILTER_TAGS = 15;

function Places() {

    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showAllTags, setShowAllTags] = useState(false);
    const [sortOrder, setSortOrder] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);



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
        axios.get(`${API_URL}/api/tags?scope=place`).then((res) => setAvailableTags(res.data.data));
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
        const q = normalizeText(searchText);
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
            if (q.length > 0) {
                const haystack = normalizeText([place.place_name, place.place_description, place.address?.city, place.address?.postal_code].filter(Boolean).join(" "));
                if (!haystack.includes(q)) {
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
    }, [data, selectedCategory, selectedTags, sortOrder, searchText]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(e.target.value);
        setPage(1);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        setPage(1);
        setSearchParams(value ? { search: value } : {}, { replace: true });
    };

    return <Container maxWidth="xl" id="place" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>
        <Seo
            title="Tous les lieux dog-friendly"
            description="Parcourez les parcs, plages, restaurants et autres lieux dog-friendly référencés par la communauté Woofalk, filtrables par catégorie et par tag."
        />

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

            <Box sx={{ marginTop: "18px", marginBottom: "14px", maxWidth: "360px" }}>
                <TextField
                    id="places-search-field"
                    label="Rechercher un lieu"
                    placeholder="Nom, ville, code postal…"
                    value={searchText}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
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
                    <MenuItem value="Plage">Plage</MenuItem>
                    <MenuItem value="Restaurant">Restaurant</MenuItem>
                    <MenuItem value="Visite">Visite</MenuItem>
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

                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <InputLabel id="place-page-size-label" sx={{ whiteSpace: "nowrap" }}>Afficher :</InputLabel>
                    <Select
                        labelId="place-page-size-label"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        size="small"
                    >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <MenuItem key={size} value={size}>{size}</MenuItem>
                        ))}
                    </Select>
                </Box>
            </Box>

            {availableTags.length > 0 ? (
                <Box
                    role="group"
                    aria-label="Filtrer par tags"
                    sx={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" }}
                >
                    {(showAllTags ? availableTags : availableTags.slice(0, MAX_VISIBLE_FILTER_TAGS)).map((t) => {
                        const selected = selectedTags.includes(t.id);
                        return (
                            <Chip
                                key={t.id}
                                label={`#${truncateLabel(t.tag_name)}`}
                                title={t.tag_name}
                                size="small"
                                clickable
                                onClick={() => toggleTag(t.id)}
                                variant={selected ? "filled" : "outlined"}
                                aria-pressed={selected}
                                sx={selected ? {
                                    bgcolor: t.color,
                                    color: getReadableTextColor(t.color),
                                    borderColor: t.color,
                                    "&:hover": { bgcolor: t.color, opacity: 0.85 },
                                } : {
                                    color: t.color,
                                    borderColor: t.color,
                                }}
                            />
                        );
                    })}
                    {availableTags.length > MAX_VISIBLE_FILTER_TAGS ? (
                        <Button
                            size="small"
                            onClick={() => setShowAllTags((current) => !current)}
                            aria-expanded={showAllTags}
                        >
                            {showAllTags ? "Voir moins" : `Voir plus (${availableTags.length - MAX_VISIBLE_FILTER_TAGS})`}
                        </Button>
                    ) : null}
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
