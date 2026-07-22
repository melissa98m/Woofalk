import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Container,
    Typography,
    Select , MenuItem , InputLabel,
    Pagination
} from "@mui/material";

import axios from "axios";
import auth from "../../services/auth/token";
import NewPlace from "./newPlace";
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
    }, []);

    const handleDataChange = async (dataChange) => {
        await setData(dataChange)
    }

    const filteredData = useMemo(() => {
        let result = data?.filter((place) => {
            if (selectedCategory) {
                return place.category.category_name === selectedCategory;
            }
            return true;
        }) ?? [];
        if (sortOrder === "nom-asc") {
            result = [...result].sort((a, b) => a.place_name.localeCompare(b.place_name));
        } else if (sortOrder === "nom-desc") {
            result = [...result].sort((a, b) => b.place_name.localeCompare(a.place_name));
        }
        return result;
    }, [data, selectedCategory, sortOrder]);

    const pageCount = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
    const pagedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    return <Container maxWidth="lg" id="place" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginTop: "20px", marginBottom: "6px" }}>
                <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Lieux autorisés aux chiens</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data ? `${data.length} lieu${data.length > 1 ? "x" : ""} référencé${data.length > 1 ? "s" : ""}` : "…"}
                    </Typography>
                </Box>
                {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
                    <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <NewPlace newValue={{data}} handleDataChange={handleDataChange} />
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
                    </Select>
                </Box>
            </Box>
            {loading ? (
                <Typography role="status" aria-live="polite" variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des lieux...</Typography>
            ) : (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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
