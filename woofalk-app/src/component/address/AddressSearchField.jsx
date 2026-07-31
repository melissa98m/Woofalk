import { Autocomplete, TextField } from "@mui/material";
import { useRef, useState } from "react";
import { searchAddresses } from "../../services/geocode";

// Debounced address autocomplete backed by the BAN API. Selecting a
// suggestion already carries postal code/city/lat/lon, so callers don't
// need to geocode separately.
export function AddressSearchField({ value, onSelect, label = "Rechercher une adresse", variant = "standard", sx }) {
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef(null);

    let handleInputChange = (text) => {
        setQuery(text);
        clearTimeout(debounceRef.current);
        if (text.trim().length < 3) {
            setOptions([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                setOptions(await searchAddresses(text));
            } catch (err) {
                console.log(err);
            } finally {
                setSearching(false);
            }
        }, 300);
    };

    return (
        <Autocomplete
            options={options}
            filterOptions={(x) => x}
            getOptionLabel={(option) => option?.label || ''}
            isOptionEqualToValue={(option, val) => option.label === val.label}
            loading={searching}
            inputValue={query}
            onInputChange={(e, newInputValue, reason) => {
                if (reason === 'input') {
                    handleInputChange(newInputValue);
                    return;
                }
                // "reset" (a suggestion was picked, or the field blurred back
                // to the last valid value) or "clear" — mirror the text so
                // the field actually shows the pick instead of what was
                // typed, but don't kick off a new search for it.
                clearTimeout(debounceRef.current);
                setQuery(newInputValue);
                setOptions([]);
            }}
            value={value}
            onChange={(e, newValue) => onSelect(newValue)}
            noOptionsText={query.trim().length < 3 ? "Tapez au moins 3 caractères" : "Aucune adresse trouvée"}
            renderInput={(params) => (
                <TextField {...params} label={label} variant={variant} sx={sx} />
            )}
        />
    );
}

export default AddressSearchField;
