import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useState } from "react";
import { useDivisionsList, resolveDivisionCenter } from "../../services/geo/divisions";
import { normalizeText } from "../../services/search/searchIndex";

// Autocomplete over France's ~101 départements + 18 régions. Unlike
// AddressSearchField (which queries the BAN API per keystroke and needs full
// control over the displayed text to debounce), the full division list is
// small enough to fetch once and filter client-side — so the input text here
// is left uncontrolled and just tracked locally for filtering; Autocomplete
// syncs the displayed text to the selected `value` on its own.
//
// A division has no coordinates by itself (see resolveDivisionCenter, which
// takes a network round-trip), so onSelect fires twice per pick: immediately
// with { ...division, latitude: null, longitude: null, resolving: true } so
// the field shows the pick right away, then again once resolved (or with
// null if resolution fails) — callers should treat latitude/longitude being
// non-null as "ready".
//
// Typing a postal code (or just its leading digits, e.g. "38100" or "38")
// also matches the corresponding département: French postal codes start
// with the département code, except overseas ones ("97"/"98" prefix) which
// need 3 digits, and Corse where both 2A and 2B share the "20" prefix.
function departementCodesFromPostalPrefix(digits) {
    const prefix = digits.startsWith("97") || digits.startsWith("98") ? digits.slice(0, 3) : digits.slice(0, 2);
    if (prefix === "20") return ["2A", "2B"];
    return [prefix];
}

export function DivisionSearchField({ value, onSelect, label = "Département ou région", variant = "standard", sx }) {
    const [query, setQuery] = useState("");
    const [error, setError] = useState(null);
    const { divisions, loading, ensureLoaded } = useDivisionsList();

    const q = normalizeText(query);
    const isPostalPrefix = /^\d{2,5}$/.test(q);
    const options = isPostalPrefix
        ? (() => {
            const codes = departementCodesFromPostalPrefix(q);
            return divisions.filter((d) => d.type === "departement" && codes.includes(d.code)).slice(0, 15);
        })()
        : q.length >= 1
            ? divisions.filter((d) => normalizeText(d.label).includes(q)).slice(0, 15)
            : [];
    const resolving = !!(value && value.latitude == null);

    const handleChange = async (e, newValue) => {
        setError(null);
        if (!newValue) {
            onSelect(null);
            return;
        }
        onSelect({ ...newValue, latitude: null, longitude: null, resolving: true });
        try {
            const resolved = await resolveDivisionCenter(newValue);
            if (!resolved) {
                setError("Zone introuvable, réessayez.");
                onSelect(null);
                return;
            }
            onSelect({ ...newValue, ...resolved, resolving: false });
        } catch (err) {
            setError("Impossible de localiser cette zone pour le moment.");
            onSelect(null);
        }
    };

    return (
        <Autocomplete
            options={options}
            filterOptions={(x) => x}
            getOptionLabel={(option) => option?.label || ""}
            isOptionEqualToValue={(option, val) => option.label === val.label}
            loading={loading}
            onFocus={ensureLoaded}
            onInputChange={(e, newInputValue, reason) => {
                if (reason === "input") setQuery(newInputValue);
            }}
            value={value}
            onChange={handleChange}
            noOptionsText={q.length < 1 ? "Tapez le nom, le code ou un code postal d'un département ou d'une région" : "Aucun résultat"}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    variant={variant}
                    sx={sx}
                    error={!!error}
                    helperText={error || (resolving ? "Localisation de la zone…" : undefined)}
                    slotProps={{
                        ...params.slotProps,
                        input: {
                            ...params.slotProps?.input,
                            endAdornment: (
                                <>
                                    {resolving ? <CircularProgress color="inherit" size={16} /> : null}
                                    {params.slotProps?.input?.endAdornment}
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}

export default DivisionSearchField;
