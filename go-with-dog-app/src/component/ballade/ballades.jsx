import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Chip,
    Container,
    Typography,
    MenuItem , Select ,InputLabel,
    Pagination,
    TextField,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Link, useSearchParams } from "react-router-dom";

import axios from "axios";
import auth from "../../services/auth/token";
import { BalladeCard } from "../_partials/_ui/BalladeCard";
import { getReadableTextColor } from "../_partials/_ui/tagColor";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { normalizeText } from "../../services/search/searchIndex";
import { API_URL } from "../../config";

const PAGE_SIZE = 9;
const MAX_VISIBLE_FILTER_TAGS = 15;

function Ballades() {

    document.title = 'Toutes les balades';

    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showAllTags, setShowAllTags] = useState(false);
    const [sortOrder, setSortOrder] = useState("");
    const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");
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
        axios.get(`${API_URL}/api/tags?scope=ballade`).then((res) => setAvailableTags(res.data.data));
    }, []);

    const toggleTag = (tagId) => {
        setSelectedTags((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
        setPage(1);
    };

    const firstTagName = (ballade) => (ballade.tags ?? []).length > 0
        ? [...ballade.tags].map((t) => t.tag_name).sort()[0]
        : null;

    const filteredData = useMemo(() => {
        const q = normalizeText(searchText);
        let result = data?.filter((ballade) => {
            if (selectedTags.length > 0) {
                const balladeTagIds = (ballade.tags ?? []).map((t) => t.id);
                if (!selectedTags.every((id) => balladeTagIds.includes(id))) {
                    return false;
                }
            }
            if (q.length > 0) {
                const haystack = normalizeText([ballade.ballade_name, ballade.ballade_description].filter(Boolean).join(" "));
                if (!haystack.includes(q)) {
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
    }, [data, selectedTags, sortOrder, searchText]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
    const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchText(value);
        setPage(1);
        setSearchParams(value ? { search: value } : {}, { replace: true });
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

            <Box sx={{ marginTop: "18px", marginBottom: "14px", maxWidth: "360px" }}>
                <TextField
                    id="ballades-search-field"
                    label="Rechercher une balade"
                    placeholder="Nom, description…"
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
