import React, { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    Checkbox,
    FormControlLabel,
    Snackbar,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import StorageIcon from "@mui/icons-material/Storage";
import axios from "axios";
import { API_URL } from "../../config";

// Visually hides text while keeping it in the accessibility tree (fieldset
// legends here duplicate what the accordion summary already shows sighted
// users, but screen reader users still need the grouping/label).
const srOnly = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
};

function extractFilename(response, fallback) {
    const disposition = response.headers?.["content-disposition"];
    const match = disposition && disposition.match(/filename="?([^"]+)"?/);
    if (match) {
        return match[1];
    }

    // Content-Disposition can be unreadable cross-origin if the API ever
    // forgets to expose it (see config/cors.php `exposed_headers`) — fall
    // back to matching the extension to the real content-type rather than
    // risk mislabeling a .zip as .csv (or vice versa).
    const contentType = response.headers?.["content-type"] || "";
    if (contentType.includes("zip")) {
        return fallback.replace(/\.csv$/, ".zip");
    }

    return fallback;
}

function triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function Export() {
    document.title = "Export de données";

    const [tables, setTables] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selection, setSelection] = useState({});
    const [sqlLoading, setSqlLoading] = useState(false);
    const [csvLoading, setCsvLoading] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    useEffect(() => {
        axios
            .get(`${API_URL}/api/export/options`, {
                headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
            })
            .then((res) => {
                const data = res.data.data;
                setTables(data);
                setSelection(Object.fromEntries(data.map((t) => [t.key, new Set(t.columns)])));
            })
            .catch(() => {
                setToastMessage({ message: "Impossible de charger les options d'export", severity: "error" });
                setShowToast(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const selectedTablesCount = useMemo(
        () => Object.values(selection).filter((set) => set.size > 0).length,
        [selection]
    );

    const toggleTable = (tableKey, columns) => {
        setSelection((prev) => {
            const current = prev[tableKey] || new Set();
            const allSelected = columns.every((c) => current.has(c));
            return { ...prev, [tableKey]: allSelected ? new Set() : new Set(columns) };
        });
    };

    const toggleColumn = (tableKey, column) => {
        setSelection((prev) => {
            const current = new Set(prev[tableKey] || []);
            if (current.has(column)) {
                current.delete(column);
            } else {
                current.add(column);
            }
            return { ...prev, [tableKey]: current };
        });
    };

    const handleDownloadSql = async () => {
        setSqlLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/export/sql`, {
                responseType: "blob",
                headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
            });
            triggerDownload(res.data, extractFilename(res, "gowithdog-db.zip"));
        } catch (err) {
            setToastMessage({ message: "Erreur lors de l'export de la base de données", severity: "error" });
            setShowToast(true);
        } finally {
            setSqlLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        const payload = Object.fromEntries(
            Object.entries(selection)
                .filter(([, set]) => set.size > 0)
                .map(([key, set]) => [key, Array.from(set)])
        );

        setCsvLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/export/csv`,
                { tables: payload },
                {
                    responseType: "blob",
                    headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
                }
            );
            triggerDownload(res.data, extractFilename(res, "export.csv"));
        } catch (err) {
            setToastMessage({ message: "Erreur lors de l'export CSV", severity: "error" });
            setShowToast(true);
        } finally {
            setCsvLoading(false);
        }
    };

    return (
        <Box id="export">
            <Typography variant="h1" sx={{ fontSize: "26px", mb: "24px" }}>
                Export de données
            </Typography>

            <Card sx={{ borderRadius: "16px", p: { xs: "20px", sm: "24px" }, mb: "24px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: "8px" }}>
                    <StorageIcon color="action" />
                    <Typography component="h2" sx={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "16px", m: 0 }}>
                        Export complet de la base (SQL)
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: "16px" }}>
                    Télécharge une archive .zip contenant un dump SQL complet de la base de données (toutes les tables).
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleDownloadSql}
                    disabled={sqlLoading}
                >
                    {sqlLoading ? "Génération en cours…" : "Télécharger le dump SQL (.zip)"}
                </Button>
            </Card>

            <Card sx={{ borderRadius: "16px", p: { xs: "20px", sm: "24px" } }}>
                <Typography component="h2" sx={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "16px", mt: 0, mb: "8px" }}>
                    Export CSV personnalisé
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: "16px" }}>
                    Sélectionnez les données et les colonnes à exporter. Un seul tableau sélectionné donne un .csv, plusieurs donnent une archive .zip.
                </Typography>

                {loading ? (
                    <Typography role="status" aria-live="polite" color="text.secondary">
                        Chargement des options d'export…
                    </Typography>
                ) : (
                    <Box>
                        {(tables ?? []).map(({ key, label, columns }) => {
                            const selected = selection[key] || new Set();
                            const allSelected = columns.every((c) => selected.has(c));
                            const someSelected = columns.some((c) => selected.has(c));

                            return (
                                <Accordion key={key} disableGutters sx={{ "&:before": { display: "none" }, boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: "12px !important", mb: "10px", overflow: "hidden" }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${key}-content`} id={`${key}-header`}>
                                        <FormControlLabel
                                            label={`${label} (${selected.size}/${columns.length} colonnes)`}
                                            onClick={(e) => e.stopPropagation()}
                                            control={
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={!allSelected && someSelected}
                                                    onChange={() => toggleTable(key, columns)}
                                                    slotProps={{ input: { "aria-label": `Sélectionner toutes les colonnes de ${label}` } }}
                                                />
                                            }
                                        />
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
                                            <Typography component="legend" sx={srOnly}>Colonnes de {label}</Typography>
                                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "4px 12px" }}>
                                                {columns.map((column) => (
                                                    <FormControlLabel
                                                        key={column}
                                                        label={column}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={selected.has(column)}
                                                                onChange={() => toggleColumn(key, column)}
                                                            />
                                                        }
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}

                        <Button
                            variant="contained"
                            startIcon={<CloudDownloadIcon />}
                            onClick={handleDownloadCsv}
                            disabled={csvLoading || selectedTablesCount === 0}
                            sx={{ mt: "12px" }}
                        >
                            {csvLoading ? "Génération en cours…" : "Télécharger le CSV sélectionné"}
                        </Button>
                    </Box>
                )}
            </Card>

            <Snackbar
                open={toast}
                autoHideDuration={4000}
                onClose={() => setShowToast(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setShowToast(false)} severity={toastMessage.severity} sx={{ width: "100%" }}>
                    {toastMessage.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Export;
