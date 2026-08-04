import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Checkbox,
    Chip,
    Container,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { Language } from "@mui/icons-material";
import { Link } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import { Icon, divIcon, latLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import "../../assets/css/component/search/_mapSearch.scss";
import marker from "../../assets/icon.svg";
import { AddressSearchField } from "../address/AddressSearchField";
import { DivisionSearchField } from "./DivisionSearchField";
import { useSearchIndex } from "../../services/search/searchIndex";
import { haversineDistanceKm } from "../../services/geo/haversine";
import { formatDistance } from "../_partials/_ui/formatDistance";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { isSafeHttpUrl } from "../../utils/safeUrl";

const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100, 150, 250];
const DEFAULT_RADIUS_KM = 25;
// A département's or région's "center" (see resolveDivisionCenter) only
// approximates its true extent, so picking one starts from a wider radius
// than a precise address would — the user can still narrow it down after.
const DEFAULT_RADIUS_KM_BY_DIVISION = { departement: 50, region: 150 };
const DEFAULT_MAP_CENTER = [46.6, 2.2]; // France
const DEFAULT_MAP_ZOOM = 6;
const SELECTED_ITEM_ZOOM = 15;

const TYPE_META = {
    place: { label: "Lieux", pinLabel: "L", pinClass: "map-search-pin--place", chipBg: "terracottaSoft", chipColor: "terracottaDark" },
    hebergement: { label: "Hébergements", pinLabel: "H", pinClass: "map-search-pin--hebergement", chipBg: "sageSoft", chipColor: "sageDark" },
    ballade: { label: "Balades", pinLabel: "B", pinClass: "map-search-pin--ballade", chipBg: "coralSoft", chipColor: "coral" },
};

// Built once (module scope), not per render: divIcon renders raw DOM outside
// React's tree, so there's nothing to gain from recreating it every render.
const PIN_ICONS = Object.fromEntries(
    Object.entries(TYPE_META).map(([type, meta]) => [
        type,
        divIcon({
            className: "",
            html: `<div class="map-search-pin ${meta.pinClass}"><span class="map-search-pin__label">${meta.pinLabel}</span></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 26],
            popupAnchor: [0, -24],
        }),
    ])
);
// Same markup as PIN_ICONS plus a `--selected` modifier class (see
// _mapSearch.scss) so the clicked/selected pin stands out from the rest.
const SELECTED_PIN_ICONS = Object.fromEntries(
    Object.entries(TYPE_META).map(([type, meta]) => [
        type,
        divIcon({
            className: "",
            html: `<div class="map-search-pin ${meta.pinClass} map-search-pin--selected"><span class="map-search-pin__label">${meta.pinLabel}</span></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -32],
        }),
    ])
);
const CENTER_ICON = new Icon({ iconUrl: marker, iconSize: [32, 32] });

function normalizeItems(index) {
    const places = (index.places ?? [])
        .filter((p) => p.address?.latitude != null && p.address?.longitude != null)
        .map((p) => ({
            id: `place-${p.id}`,
            type: "place",
            name: p.place_name,
            lat: p.address.latitude,
            lng: p.address.longitude,
            to: `/places/${p.id}`,
            category: p.category?.category_name,
            address: p.address,
            website: p.place_website,
            tags: p.tags ?? [],
        }));

    const hebergements = (index.hebergements ?? [])
        .filter((h) => h.address?.latitude != null && h.address?.longitude != null)
        .map((h) => ({
            id: `hebergement-${h.id}`,
            type: "hebergement",
            name: h.hebergement_name,
            lat: h.address.latitude,
            lng: h.address.longitude,
            to: `/hebergements/${h.id}`,
            category: h.category?.category_name,
            address: h.address,
            website: h.hebergement_website,
            priceIndication: h.price_indication,
            tags: h.tags ?? [],
        }));

    const ballades = (index.ballades ?? [])
        .filter((b) => b.ballade_latitude != null && b.ballade_longitude != null)
        .map((b) => ({
            id: `ballade-${b.id}`,
            type: "ballade",
            name: b.ballade_name,
            lat: b.ballade_latitude,
            lng: b.ballade_longitude,
            to: `/ballades/${b.id}`,
            website: b.ballade_website,
            trailDistanceKm: b.distance,
            denivele: b.denivele,
            tags: b.tags ?? [],
        }));

    return [...places, ...hebergements, ...ballades];
}

// MapContainer only reads `center`/`zoom` on first mount, so moving the
// search zone afterwards needs an imperative setView/fitBounds via useMap().
// Nothing is ever plotted without a chosen center (see the `filtered` memo
// in MapSearch), so there's no "fit to whatever's on screen" fallback here.
function FitToResults({ center, radiusKm, programmaticMoveRef, skipNextFitRef }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            // "Rechercher dans cette zone" derives center/radiusKm from the
            // map's own current viewport, so re-fitting right after would
            // just re-animate back to (roughly) where the user already is.
            if (skipNextFitRef?.current) {
                skipNextFitRef.current = false;
                return;
            }
            // Flagged so the moveend this triggers isn't mistaken for a user
            // pan/zoom by MapMoveTracker (see "Rechercher dans cette zone").
            if (programmaticMoveRef) {
                programmaticMoveRef.current = true;
            }
            // The map sits in a CSS grid cell — Leaflet can mismeasure its own
            // pixel size in flex/grid layouts, which throws off fitBounds's
            // zoom computation unless it's told to re-measure first.
            map.invalidateSize();
            map.fitBounds(latLng(center.latitude, center.longitude).toBounds(radiusKm * 2000), { padding: [24, 24] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, radiusKm, map]);

    return null;
}

// Only fires when a list entry is selected (not when a pin itself is
// clicked, since the map is already centered there) — see `selectionSource`
// in MapSearch.
function FocusOnSelectedItem({ item, programmaticMoveRef }) {
    const map = useMap();

    useEffect(() => {
        if (item) {
            if (programmaticMoveRef) {
                programmaticMoveRef.current = true;
            }
            map.invalidateSize();
            map.flyTo([item.lat, item.lng], SELECTED_ITEM_ZOOM, { duration: 0.75 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item?.id, item?.lat, item?.lng, map]);

    return null;
}

// Shows a Google Maps-style "Rechercher dans cette zone" prompt once the
// user pans/zooms away from the last committed search — moveend also fires
// for our own programmatic fitBounds/flyTo calls, so those flag
// `programmaticMoveRef` first (see FitToResults/FocusOnSelectedItem) and
// this ignores the resulting event instead of treating it as user input.
function MapMoveTracker({ programmaticMoveRef, onUserMoved }) {
    useMapEvents({
        moveend: () => {
            if (programmaticMoveRef.current) {
                programmaticMoveRef.current = false;
                return;
            }
            onUserMoved();
        },
    });

    return null;
}

function MapSearch() {
    document.title = "Carte des lieux, hébergements et balades";

    const theme = useTheme();
    const { index, loading, ensureLoaded } = useSearchIndex();
    const [hasRequested, setHasRequested] = useState(false);
    const [center, setCenter] = useState(null);
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
    const [selectedTypes, setSelectedTypes] = useState({ place: true, hebergement: true, ballade: true });
    const [selectedId, setSelectedId] = useState(null);
    // Tracks whether the current selection came from clicking a pin or a
    // list entry, so the map only zooms in for list selections and the
    // list only auto-scrolls for pin clicks (see below).
    const [selectionSource, setSelectionSource] = useState(null);
    // True once the user has panned/zoomed away from the last committed
    // search — shows the "Rechercher dans cette zone" button.
    const [mapDirty, setMapDirty] = useState(false);
    const listItemRefs = useRef({});
    const mapRef = useRef(null);
    // Distinguishes our own fitBounds/flyTo calls from a real user pan/zoom
    // (both fire the same 'moveend' event) — see MapMoveTracker.
    const programmaticMoveRef = useRef(false);
    // Set right before a "Rechercher dans cette zone" search commits its
    // derived center/radius, so FitToResults doesn't re-animate back to a
    // view the map is already showing.
    const skipNextFitRef = useRef(false);

    useEffect(() => {
        ensureLoaded();
        setHasRequested(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const normalized = useMemo(() => normalizeItems(index), [index]);

    // A division's center takes a network round-trip to resolve (see
    // DivisionSearchField), so `center` can briefly be non-null with
    // latitude/longitude still null — hasCenter is the "actually ready" flag.
    const hasCenter = !!(center && center.latitude != null && center.longitude != null);
    const resolvingCenter = !!(center && !hasCenter);

    // Nothing is shown until the user has picked a search zone — with ~7,400
    // places in the catalog, dumping every pin on the map by default would
    // be both useless and a performance problem.
    const filtered = useMemo(() => {
        if (!hasCenter) return [];
        return normalized
            .filter((item) => selectedTypes[item.type])
            .map((item) => ({ ...item, distanceKm: haversineDistanceKm(center.latitude, center.longitude, item.lat, item.lng) }))
            .filter((item) => item.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }, [normalized, selectedTypes, center, radiusKm]);

    // Reset the selection whenever the search zone/filters change so a
    // stale pin/list entry doesn't stay highlighted once it's no longer shown.
    // A committed search (address, division, radius, or "search this area")
    // also means the map no longer disagrees with the results shown, so the
    // "Rechercher dans cette zone" prompt goes away too.
    useEffect(() => {
        setSelectedId(null);
        setSelectionSource(null);
        setMapDirty(false);
    }, [center, radiusKm, selectedTypes]);

    useEffect(() => {
        if (selectedId && selectionSource === "map") {
            listItemRefs.current[selectedId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [selectedId, selectionSource]);

    const selectedItem = useMemo(() => filtered.find((item) => item.id === selectedId) ?? null, [filtered, selectedId]);

    const selectFromMap = useCallback((id) => {
        setSelectionSource("map");
        setSelectedId(id);
    }, []);

    const selectFromList = useCallback((id, expanded) => {
        if (expanded) {
            setSelectionSource("list");
            setSelectedId(id);
        } else {
            setSelectedId((current) => (current === id ? null : current));
        }
    }, []);

    const toggleType = (type) => (e) => {
        setSelectedTypes((current) => ({ ...current, [type]: e.target.checked }));
    };

    // Re-centers the committed search on the map's current viewport instead
    // of a picked address/division — the radius is the distance from the
    // viewport's center to its nearest edge, so the search circle stays
    // fully inside what the user can actually see.
    const handleSearchThisArea = useCallback(() => {
        const map = mapRef.current;
        if (!map) return;

        const bounds = map.getBounds();
        const viewCenter = bounds.getCenter();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const edgeDistancesKm = [
            haversineDistanceKm(viewCenter.lat, viewCenter.lng, ne.lat, viewCenter.lng),
            haversineDistanceKm(viewCenter.lat, viewCenter.lng, viewCenter.lat, ne.lng),
            haversineDistanceKm(viewCenter.lat, viewCenter.lng, sw.lat, viewCenter.lng),
            haversineDistanceKm(viewCenter.lat, viewCenter.lng, viewCenter.lat, sw.lng),
        ];

        skipNextFitRef.current = true;
        setCenter({ latitude: viewCenter.lat, longitude: viewCenter.lng, label: "Zone actuelle de la carte", source: "viewport" });
        setRadiusKm(Math.max(1, Math.round(Math.min(...edgeDistancesKm))));
    }, []);

    const handleAddressSelect = (option) => {
        setCenter(option ? { ...option, source: "address" } : null);
    };

    const handleDivisionSelect = (option) => {
        if (!option) {
            setCenter(null);
            return;
        }
        setCenter({ ...option, source: "division" });
        setRadiusKm(DEFAULT_RADIUS_KM_BY_DIVISION[option.type] ?? DEFAULT_RADIUS_KM);
    };

    const isLoading = !hasRequested || loading;
    const noTypeSelected = !Object.values(selectedTypes).some(Boolean);

    return (
        <Container maxWidth="xl" id="map-search" sx={{ px: { xs: 2, md: 4 }, pb: "40px" }}>
            <Box sx={{ marginTop: "20px", marginBottom: "6px" }}>
                <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>
                    Rechercher sur la carte
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isLoading
                        ? "…"
                        : resolvingCenter
                            ? "Localisation de la zone…"
                            : !hasCenter
                                ? "Choisissez une adresse, une ville, un département ou une région pour lancer la recherche"
                                : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} dans un rayon de ${radiusKm} km`}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    marginTop: "18px",
                    marginBottom: "24px",
                }}
            >
                <Box sx={{ minWidth: "260px", flex: "1 1 260px", maxWidth: "420px" }}>
                    <AddressSearchField
                        value={center?.source === "address" ? center : null}
                        onSelect={handleAddressSelect}
                        label="Adresse, ville ou code postal"
                        variant="outlined"
                    />
                </Box>

                <Typography
                    sx={{
                        alignSelf: "center",
                        width: { xs: "100%", sm: "auto" },
                        textAlign: "center",
                        color: "text.secondary",
                        fontSize: "13px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    ou
                </Typography>

                <Box sx={{ minWidth: "220px", flex: "1 1 220px", maxWidth: "360px" }}>
                    <DivisionSearchField
                        value={center?.source === "division" ? center : null}
                        onSelect={handleDivisionSelect}
                        label="Département, région ou code postal"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <InputLabel id="map-search-radius-label" sx={{ whiteSpace: "nowrap" }}>Rayon :</InputLabel>
                    <Select
                        labelId="map-search-radius-label"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(e.target.value)}
                        disabled={!hasCenter}
                        size="small"
                    >
                        {RADIUS_OPTIONS_KM.map((km) => (
                            <MenuItem key={km} value={km}>{km} km</MenuItem>
                        ))}
                    </Select>
                </Box>

                <FormControl component="fieldset" variant="standard" sx={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
                    <FormLabel component="legend" sx={{ fontSize: "13px", marginBottom: "2px", padding: 0 }}>Afficher :</FormLabel>
                    <FormGroup row>
                        {Object.entries(TYPE_META).map(([type, meta]) => (
                            <FormControlLabel
                                key={type}
                                control={<Checkbox checked={selectedTypes[type]} onChange={toggleType(type)} size="small" />}
                                label={meta.label}
                            />
                        ))}
                    </FormGroup>
                </FormControl>
            </Box>

            {isLoading ? (
                <Typography role="status" aria-live="polite" variant="h5" sx={{ textAlign: "center" }} gutterBottom>
                    Chargement de la carte...
                </Typography>
            ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" }, gap: "24px" }}>
                    <Box
                        role="region"
                        aria-label="Carte des résultats"
                        sx={{
                            position: "relative",
                            borderRadius: "20px",
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            height: { xs: "50vh", md: "65vh" },
                            "& .leaflet-container": { height: "100%", width: "100%" },
                        }}
                    >
                        <Box
                            aria-live="polite"
                            sx={{
                                position: "absolute",
                                top: "12px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                zIndex: 1000,
                            }}
                        >
                            {hasCenter && mapDirty ? (
                                <Button
                                    onClick={handleSearchThisArea}
                                    startIcon={<SearchIcon fontSize="small" aria-hidden="true" />}
                                    size="small"
                                    variant="contained"
                                    disableElevation
                                    sx={{
                                        bgcolor: "background.paper",
                                        color: "text.primary",
                                        borderRadius: "999px",
                                        boxShadow: 3,
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": { bgcolor: "background.paper", boxShadow: 5 },
                                    }}
                                >
                                    Rechercher dans cette zone
                                </Button>
                            ) : null}
                        </Box>
                        <MapContainer ref={mapRef} center={DEFAULT_MAP_CENTER} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <FitToResults
                                center={hasCenter ? center : null}
                                radiusKm={radiusKm}
                                programmaticMoveRef={programmaticMoveRef}
                                skipNextFitRef={skipNextFitRef}
                            />
                            {selectionSource === "list" ? (
                                <FocusOnSelectedItem item={selectedItem} programmaticMoveRef={programmaticMoveRef} />
                            ) : null}
                            {hasCenter ? <MapMoveTracker programmaticMoveRef={programmaticMoveRef} onUserMoved={() => setMapDirty(true)} /> : null}
                            {hasCenter ? (
                                <>
                                    <Marker position={[center.latitude, center.longitude]} icon={CENTER_ICON}>
                                        <Popup>{center.label}</Popup>
                                    </Marker>
                                    <Circle
                                        center={[center.latitude, center.longitude]}
                                        radius={radiusKm * 1000}
                                        pathOptions={{ color: theme.palette.primary.main, fillOpacity: 0.08 }}
                                    />
                                </>
                            ) : null}
                            {filtered.map((item) => (
                                <Marker
                                    key={item.id}
                                    position={[item.lat, item.lng]}
                                    icon={selectedId === item.id ? SELECTED_PIN_ICONS[item.type] : PIN_ICONS[item.type]}
                                    zIndexOffset={selectedId === item.id ? 1000 : 0}
                                    eventHandlers={{ click: () => selectFromMap(item.id) }}
                                >
                                    <Popup>
                                        <strong>{item.name}</strong>
                                        <br />
                                        {TYPE_META[item.type].label}
                                        {item.distanceKm != null ? ` · ${formatDistance(Math.round(item.distanceKm * 10) / 10)}` : ""}
                                        <br />
                                        <Link to={item.to}>Voir la fiche</Link>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </Box>

                    <Box
                        component="section"
                        aria-label="Résultats de la recherche"
                        sx={{
                            minHeight: 0,
                            maxHeight: { xs: "none", md: "65vh" },
                            overflowY: { xs: "visible", md: "auto" },
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: "16px",
                        }}
                    >
                        {resolvingCenter ? (
                            <Typography role="status" aria-live="polite" sx={{ padding: "16px" }}>Localisation de la zone…</Typography>
                        ) : !hasCenter ? (
                            <Typography role="status" aria-live="polite" sx={{ padding: "16px" }}>
                                Choisissez une adresse, une ville, un code postal, un département ou une région pour afficher les résultats.
                            </Typography>
                        ) : noTypeSelected ? (
                            <Typography role="status" aria-live="polite" sx={{ padding: "16px" }}>Sélectionnez au moins un type d'élément à afficher.</Typography>
                        ) : filtered.length === 0 ? (
                            <Typography role="status" aria-live="polite" sx={{ padding: "16px" }}>Aucun résultat dans cette zone.</Typography>
                        ) : (
                            filtered.map((item) => {
                                const meta = TYPE_META[item.type];
                                const isSelected = selectedId === item.id;
                                return (
                                    <Accordion
                                        key={item.id}
                                        ref={(node) => { listItemRefs.current[item.id] = node; }}
                                        expanded={isSelected}
                                        onChange={(e, expanded) => selectFromList(item.id, expanded)}
                                        disableGutters
                                        square
                                        sx={{
                                            "&:before": { display: "none" },
                                            "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" },
                                            ...(isSelected ? { bgcolor: "action.selected" } : {}),
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon aria-hidden="true" />}
                                            aria-controls={`${item.id}-details`}
                                            id={`${item.id}-header`}
                                        >
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                    <Chip size="small" label={meta.label} sx={{ bgcolor: meta.chipBg, color: meta.chipColor, fontWeight: 700 }} />
                                                    <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>{item.name}</Typography>
                                                </Box>
                                                {item.distanceKm != null ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDistance(Math.round(item.distanceKm * 10) / 10)} de la zone recherchée
                                                    </Typography>
                                                ) : null}
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails id={`${item.id}-details`}>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                                                {item.category ? <Typography variant="body2"><strong>Catégorie :</strong> {item.category}</Typography> : null}
                                                {item.address ? (
                                                    <Typography variant="body2">
                                                        <strong>Adresse :</strong> {item.address.address}, {item.address.postal_code} {item.address.city}
                                                    </Typography>
                                                ) : null}
                                                {item.priceIndication ? <Typography variant="body2"><strong>Prix :</strong> {item.priceIndication}</Typography> : null}
                                                {item.type === "ballade" ? (
                                                    <Typography variant="body2">
                                                        <strong>Distance :</strong> {item.trailDistanceKm != null ? formatDistance(item.trailDistanceKm) : "non renseignée"}
                                                        {item.denivele != null ? ` · Dénivelé : ${item.denivele} m` : ""}
                                                    </Typography>
                                                ) : null}
                                                {item.tags && item.tags.length > 0 ? (
                                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                        {item.tags.map((t) => (
                                                            <Chip
                                                                key={t.id}
                                                                size="small"
                                                                variant="outlined"
                                                                label={`#${truncateLabel(t.tag_name)}`}
                                                                title={t.tag_name}
                                                                sx={{ color: t.color, borderColor: t.color }}
                                                            />
                                                        ))}
                                                    </Box>
                                                ) : null}
                                                {item.website && isSafeHttpUrl(item.website) ? (
                                                    <Typography
                                                        component="a"
                                                        href={item.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Visiter le site officiel de ${item.name} (nouvel onglet)`}
                                                        sx={{ color: "primary.main", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                    >
                                                        Visiter le site <Language fontSize="inherit" aria-hidden="true" />
                                                    </Typography>
                                                ) : null}
                                                <Button component={Link} to={item.to} variant="contained" size="small" sx={{ alignSelf: "flex-start" }}>
                                                    Voir la fiche
                                                </Button>
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                );
                            })
                        )}
                    </Box>
                </Box>
            )}
        </Container>
    );
}

export default MapSearch;
