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
import { Link, useSearchParams } from "react-router";

import axios from "axios";
import auth from "../../services/auth/token";
import { HebergementCard } from "../_partials/_ui/HebergementCard";
import { getReadableTextColor } from "../_partials/_ui/tagColor";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { normalizeText } from "../../services/search/searchIndex";
import { Seo } from "../_partials/_seo/Seo";
import { API_URL } from "../../config";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const MAX_VISIBLE_FILTER_TAGS = 15;

function Hebergements() {

    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showAllTags, setShowAllTags] = useState(false);
    const [sortOrder, setSortOrder] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);



    useEffect(() => {
        axios.get(`${API_URL}/api/hebergements`).then((actualData) => {
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
        axios.get(`${API_URL}/api/categories?scope=hebergement`).then((res) => setCategories(res.data.data));
        axios.get(`${API_URL}/api/tags?scope=hebergement`).then((res) => setAvailableTags(res.data.data));
    }, []);

    const toggleTag = (tagId) => {
        setSelectedTags((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
        setPage(1);
    };

    const firstTagName = (hebergement) => (hebergement.tags ?? []).length > 0
        ? [...hebergement.tags].map((t) => t.tag_name).sort()[0]
        : null;

    const filteredData = useMemo(() => {
        const q = normalizeText(searchText);
        let result = data?.filter((hebergement) => {
            if (selectedCategory && hebergement.category?.category_name !== selectedCategory) {
                return false;
            }
            if (selectedTags.length > 0) {
                const hebergementTagIds = (hebergement.tags ?? []).map((t) => t.id);
                if (!selectedTags.every((id) => hebergementTagIds.includes(id))) {
                    return false;
                }
            }
            if (q.length > 0) {
                const haystack = normalizeText([hebergement.hebergement_name, hebergement.hebergement_description, hebergement.address?.city, hebergement.address?.postal_code].filter(Boolean).join(" "));
                if (!haystack.includes(q)) {
                    return false;
                }
            }
            return true;
        }) ?? [];
        if (sortOrder === "nom-asc") {
            result = [...result].sort((a, b) => a.hebergement_name.localeCompare(b.hebergement_name));
        } else if (sortOrder === "nom-desc") {
            result = [...result].sort((a, b) => b.hebergement_name.localeCompare(a.hebergement_name));
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

    return <Container maxWidth="xl" id="hebergement" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>
        <Seo
            title="Tous les hébergements dog-friendly"
            description="Trouvez un hébergement qui accepte les chiens : gîtes, hôtels et locations référencés et notés par la communauté Woofalk."
        />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginTop: "20px", marginBottom: "6px" }}>
                <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Hébergements acceptant les chiens</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data ? `${data.length} hébergement${data.length > 1 ? "s" : ""} référencé${data.length > 1 ? "s" : ""}` : "…"}
                    </Typography>
                </Box>
                {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
                    <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <Button component={Link} to="/hebergements/new" variant="contained">Ajouter un hébergement</Button>
                    </Box>
                ) : null}
            </Box>

            <Box sx={{ marginTop: "18px", marginBottom: "14px", maxWidth: "360px" }}>
                <TextField
                    id="hebergements-search-field"
                    label="Rechercher un hébergement"
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
                <InputLabel id="hebergement-category-filter-label" sx={{ whiteSpace: "nowrap" }}>Catégorie :</InputLabel>
                <Select
                    labelId="hebergement-category-filter-label"
                    value={selectedCategory}
                    onChange={handleFilterChange(setSelectedCategory)}
                    size="small"
                >
                    <MenuItem value={null}>Toutes catégories</MenuItem>
                    {categories.map((c) => (
                        <MenuItem key={c.id} value={c.category_name}>{c.category_name}</MenuItem>
                    ))}
                </Select>

                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: { md: "auto" } }}>
                    <InputLabel id="hebergement-sort-label" sx={{ whiteSpace: "nowrap" }}>Trier par :</InputLabel>
                    <Select
                        labelId="hebergement-sort-label"
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
                    <InputLabel id="hebergement-page-size-label" sx={{ whiteSpace: "nowrap" }}>Afficher :</InputLabel>
                    <Select
                        labelId="hebergement-page-size-label"
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
                <Typography role="status" aria-live="polite" variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des hébergements...</Typography>
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
                        {pagedData.map((hebergement) => (
                            <HebergementCard key={hebergement.id} hebergement={hebergement} />
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
                                aria-label="Pagination des hébergements"
                            />
                        </Box>
                    ) : null}
                </>
            )}


    </Container>
}

export default Hebergements;
