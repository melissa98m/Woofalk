import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PublishIcon from "@mui/icons-material/Publish";
import axios from "axios";
import { API_URL } from "../../config";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // mirrors the API's max:5120 (KB) rule

const ACTION_LABELS = {
    create: "Création",
    update: "Mise à jour",
    unchanged: "Inchangé",
    error: "Erreur",
};

const ACTION_COLORS = {
    create: "success",
    update: "info",
    unchanged: "default",
    error: "error",
};

function fileSignature(table, file) {
    return file ? `${table}:${file.name}:${file.size}:${file.lastModified}` : null;
}

function ImportReport({ report }) {
    const { summary, rows } = report;

    return (
        <Box sx={{ mt: "16px" }}>
            <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap", mb: "12px" }}>
                <Chip label={`${summary.toCreate} création(s)`} color="success" size="small" />
                <Chip label={`${summary.toUpdate} mise(s) à jour`} color="info" size="small" />
                <Chip label={`${summary.unchanged} inchangée(s)`} size="small" />
                <Chip label={`${summary.errors} erreur(s)`} color={summary.errors > 0 ? "error" : "default"} size="small" />
            </Box>
            <TableContainer sx={{ maxHeight: 360, overflowX: "auto", border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ligne</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Détail</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.row}>
                                <TableCell>{row.row}</TableCell>
                                <TableCell>
                                    <Chip label={ACTION_LABELS[row.action] || row.action} color={ACTION_COLORS[row.action]} size="small" />
                                </TableCell>
                                <TableCell>{row.name || "—"}</TableCell>
                                <TableCell sx={{ color: "error.main" }}>{(row.errors || []).join(" · ")}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

function Import() {
    document.title = "Import de données";

    const [tables, setTables] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState("");
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState("");
    const [previewReport, setPreviewReport] = useState(null);
    const [previewSignature, setPreviewSignature] = useState(null);
    const [commitReport, setCommitReport] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    useEffect(() => {
        axios
            .get(`${API_URL}/api/import/options`)
            .then((res) => {
                const data = res.data.data;
                setTables(data);
                if (data.length > 0) {
                    setSelectedTable(data[0].key);
                }
            })
            .catch(() => {
                setToastMessage({ message: "Impossible de charger les options d'import", severity: "error" });
                setShowToast(true);
            })
            .finally(() => setLoading(false));
    }, []);

    const currentTable = useMemo(() => (tables ?? []).find((t) => t.key === selectedTable), [tables, selectedTable]);

    const currentSignature = fileSignature(selectedTable, file);
    const canCommit = previewReport && !commitReport && previewSignature === currentSignature && previewReport.summary.total > 0;

    const resetOutcome = () => {
        setPreviewReport(null);
        setPreviewSignature(null);
        setCommitReport(null);
    };

    const handleTableChange = (event) => {
        setSelectedTable(event.target.value);
        resetOutcome();
    };

    const handleFileChange = (event) => {
        const selected = event.target.files[0] || null;
        resetOutcome();
        setFileError("");

        if (selected && !/\.(csv|txt)$/i.test(selected.name)) {
            setFile(null);
            setFileError("Le fichier doit être un .csv.");
            return;
        }
        if (selected && selected.size > MAX_FILE_SIZE_BYTES) {
            setFile(null);
            setFileError("Le fichier dépasse la taille maximale de 5 Mo.");
            return;
        }
        setFile(selected);
    };

    const runImport = async (endpoint, { onSuccess }) => {
        const formData = new FormData();
        formData.append("table", selectedTable);
        formData.append("file", file);

        try {
            const res = await axios.post(`${API_URL}/api/import/${endpoint}`, formData);
            onSuccess(res.data);
        } catch (err) {
            const message = err.response?.data?.message || "Erreur lors de l'import";
            setToastMessage({ message, severity: "error" });
            setShowToast(true);
        }
    };

    const handlePreview = async () => {
        setPreviewing(true);
        setCommitReport(null);
        await runImport("preview", {
            onSuccess: (data) => {
                setPreviewReport(data);
                setPreviewSignature(currentSignature);
            },
        });
        setPreviewing(false);
    };

    const handleCommit = async () => {
        setCommitting(true);
        await runImport("commit", {
            onSuccess: (data) => {
                setCommitReport(data);
                setToastMessage({ message: "Import terminé", severity: "success" });
                setShowToast(true);
            },
        });
        setCommitting(false);
    };

    return (
        <Box id="import">
            <Typography variant="h1" sx={{ fontSize: "26px", mb: "24px" }}>
                Import de données
            </Typography>

            <Card sx={{ borderRadius: "16px", p: { xs: "20px", sm: "24px" } }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: "16px" }}>
                    Importe des lieux, balades, hébergements, catégories, tags ou adresses depuis un fichier CSV. Une ligne
                    dont le nom (et l'adresse, le cas échéant) correspond déjà à une entrée existante la met à jour au lieu
                    d'en créer une nouvelle. Un aperçu sans écriture en base est obligatoire avant de confirmer l'import.
                </Typography>

                {loading ? (
                    <Typography role="status" aria-live="polite" color="text.secondary">
                        Chargement des options d'import…
                    </Typography>
                ) : (
                    <>
                        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, mb: "16px" }}>
                            <Typography component="legend" sx={{ fontWeight: 600, fontSize: "14px", mb: "8px" }}>
                                Type de données
                            </Typography>
                            <RadioGroup value={selectedTable} onChange={handleTableChange}>
                                {(tables ?? []).map(({ key, label }) => (
                                    <FormControlLabel key={key} value={key} control={<Radio />} label={label} />
                                ))}
                            </RadioGroup>
                        </Box>

                        {currentTable && (
                            <Alert severity="info" sx={{ mb: "16px" }}>
                                Colonnes attendues : {currentTable.columns.map((c) => `${c.name}${c.required ? "*" : ""}`).join(", ")}
                                {" "}(* obligatoire). Un identifiant présent dans le fichier est ignoré ; la correspondance se
                                fait par nom{["places", "hebergements"].includes(selectedTable) ? " et adresse" : ""}
                                {selectedTable === "ballades" ? " et coordonnées" : ""}.
                            </Alert>
                        )}

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mb: "16px" }}>
                            <Button component="label" variant="outlined" color="secondary" startIcon={<UploadFileIcon />} sx={{ alignSelf: "flex-start" }}>
                                {file ? "Changer le fichier" : "Choisir un fichier CSV"}
                                <input
                                    id="import-file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleFileChange}
                                    style={{
                                        clip: "rect(0 0 0 0)", clipPath: "inset(50%)", height: 1, width: 1,
                                        overflow: "hidden", position: "absolute", whiteSpace: "nowrap",
                                    }}
                                />
                            </Button>
                            {file ? <Typography variant="body2" color="text.secondary">{file.name}</Typography> : null}
                            {fileError ? <Alert severity="error">{fileError}</Alert> : null}
                        </Box>

                        <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <Button
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                onClick={handlePreview}
                                disabled={!file || !selectedTable || previewing}
                            >
                                {previewing ? "Analyse en cours…" : "Aperçu"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PublishIcon />}
                                onClick={handleCommit}
                                disabled={!canCommit || committing}
                            >
                                {committing ? "Import en cours…" : "Confirmer l'import"}
                            </Button>
                        </Box>

                        {commitReport ? (
                            <Box role="status" aria-live="polite">
                                <Typography variant="body2" sx={{ mt: "16px", fontWeight: 600 }}>
                                    Import terminé
                                </Typography>
                                <ImportReport report={commitReport} />
                            </Box>
                        ) : previewReport ? (
                            <Box role="status" aria-live="polite">
                                <Typography variant="body2" sx={{ mt: "16px", fontWeight: 600 }}>
                                    Aperçu (rien n'a été écrit en base)
                                </Typography>
                                <ImportReport report={previewReport} />
                            </Box>
                        ) : null}
                    </>
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

export default Import;
