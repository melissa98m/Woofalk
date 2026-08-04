import { useMemo, useState } from "react";
import { Autocomplete, Box, Button, IconButton, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { useNavigate } from "react-router-dom";
import { useSearchIndex, buildSuggestions } from "../../services/search/searchIndex";

// Compact pill (navbar/drawer) by default; variant="hero" renders the
// larger home-page search with a visible "Chercher" button.
const Search = ({
    placeholder = "Rechercher un lieu, une balade…",
    label = "Recherche rapide",
    variant = "pill",
    onNavigate,
}) => {
    const navigate = useNavigate();
    const { index, loading, ensureLoaded } = useSearchIndex();
    const [query, setQuery] = useState("");

    const suggestions = useMemo(() => buildSuggestions(query, index), [query, index]);

    const goTo = (path) => {
        setQuery("");
        navigate(path);
        onNavigate?.();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        goTo(`/recherche?q=${encodeURIComponent(trimmed)}`);
    };

    const isHero = variant === "hero";

    return (
        <Box
            component="form"
            role="search"
            aria-label={label}
            onSubmit={handleSubmit}
            sx={{ display: "flex", alignItems: "center", gap: { xs: "4px", sm: "8px" }, width: "100%" }}
        >
            <Autocomplete
                freeSolo
                fullWidth
                options={suggestions}
                loading={loading}
                filterOptions={(x) => x}
                groupBy={(option) => (option.type === "place" ? "Lieux" : "Balades")}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
                isOptionEqualToValue={(option, val) => option.id === val.id && option.type === val.type}
                inputValue={query}
                onFocus={ensureLoaded}
                onInputChange={(e, newInputValue, reason) => {
                    if (reason === "input") setQuery(newInputValue);
                }}
                onChange={(e, newValue) => {
                    if (newValue && typeof newValue !== "string") goTo(newValue.to);
                }}
                noOptionsText={query.trim().length < 2 ? "Tapez au moins 2 caractères" : "Aucun résultat"}
                renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                        <Box component="li" key={`${option.type}-${option.id}`} {...rest} sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {option.type === "place" ? <PlaceIcon fontSize="small" color="action" /> : <DirectionsWalkIcon fontSize="small" color="action" />}
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: "14px", fontFamily: "'Nunito', sans-serif" }} noWrap>{option.label}</Typography>
                                {option.secondary ? (
                                    <Typography sx={{ fontSize: "12px" }} color="text.secondary" noWrap>{option.secondary}</Typography>
                                ) : null}
                            </Box>
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={placeholder}
                        size="small"
                        slotProps={{
                            ...params.slotProps,
                            htmlInput: {
                                ...params.slotProps?.htmlInput,
                                "aria-label": "Rechercher un lieu ou une balade",
                            },
                            input: {
                                ...params.slotProps?.input,
                                endAdornment: (
                                    <>
                                        {params.slotProps?.input?.endAdornment}
                                        {!isHero ? (
                                            <IconButton type="submit" aria-label="Rechercher" size="small" sx={{ p: "12px" }}>
                                                <SearchIcon fontSize="small" />
                                            </IconButton>
                                        ) : null}
                                    </>
                                ),
                            },
                        }}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                                bgcolor: "background.paper",
                                fontFamily: "'Nunito', sans-serif",
                                fontSize: "14px",
                                paddingRight: !isHero ? "6px" : undefined,
                            },
                        }}
                    />
                )}
                sx={{ flex: 1, minWidth: 0 }}
            />
            {isHero ? (
                <Button type="submit" variant="contained" sx={{ padding: { xs: "8px 14px", sm: "10px 20px" }, fontSize: { xs: "13px", sm: "14px" }, flexShrink: 0 }}>
                    Chercher
                </Button>
            ) : null}
        </Box>
    );
};

export default Search;
