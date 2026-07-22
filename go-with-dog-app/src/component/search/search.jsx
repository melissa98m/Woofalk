import { Box, IconButton, InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const Search = ({ setSearchQuery, placeholder = "Rechercher un lieu, une balade…", label = "Recherche rapide" }) => (
    <Box
        component="form"
        role="search"
        aria-label={label}
        onSubmit={(e) => e.preventDefault()}
        sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            width: "100%",
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "999px",
            padding: "2px 6px 2px 16px",
        }}
    >
        <InputBase
            id="search-bar"
            onInput={(e) => setSearchQuery?.(e.target.value)}
            placeholder={placeholder}
            inputProps={{ "aria-label": "Rechercher un lieu ou une balade" }}
            sx={{ flex: 1, fontFamily: "'Nunito', sans-serif", fontSize: "14px" }}
        />
        <IconButton type="submit" aria-label="Rechercher" size="small">
            <SearchIcon fontSize="small" />
        </IconButton>
    </Box>
);

export default Search;
