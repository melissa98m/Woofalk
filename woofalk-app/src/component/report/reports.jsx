import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import update from "immutability-helper";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { SortableTableCell } from "../_partials/_ui/SortableTableCell";
import { useSort, sortRows } from "../_partials/_ui/useSort";
import { normalizeText } from "../../services/search/searchIndex";
import { getReports, dismissReport } from "../../services/report";

const TYPE_LABELS = {
    places: "Lieu",
    ballades: "Balade",
    hebergements: "Hébergement",
};

const getSortValue = (report, key) => {
    switch (key) {
        case "type": return report.reportable_type_slug;
        case "name": return report.reportable_label;
        case "subject": return report.subject;
        case "user": return report.user?.username;
        case "created_at": return report.created_at;
        case "status": return report.resolved_at ? 1 : 0;
        default: return null;
    }
};

// Admin listing of every report ("signalement") submitted against a place,
// ballade or hebergement, most recent first (API default order).
function Reports() {

    document.title = 'Signalements';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [search, setSearch] = useState("");
    const sort = useSort();

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    useEffect(() => {
        getReports().then((res) => {
            setData(res.data.data);
        }).catch(() => {
            setData(null);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const filteredData = useMemo(() => {
        const q = normalizeText(search);
        if (q.length === 0) return data ?? [];
        return (data ?? []).filter((report) => normalizeText(
            [report.reportable_label, report.subject, report.message, report.user?.username].filter(Boolean).join(" ")
        ).includes(q));
    }, [data, search]);

    const unresolvedCount = filteredData.filter((report) => !report.resolved_at).length;

    const sortedData = useMemo(
        () => sortRows(filteredData, sort.orderBy, sort.order, getSortValue),
        [filteredData, sort.orderBy, sort.order]
    );

    const handleDismiss = async (report) => {
        try {
            const res = await dismissReport(report.id);
            setData((current) => {
                const foundIndex = current.findIndex((r) => r.id === report.id);
                return update(current, { [foundIndex]: { $set: res.data.data } });
            });
        } catch {
            setToastMessage({ severity: "error", message: "Impossible de marquer ce signalement comme traité." });
            setShowToast(true);
        }
    };

    return <Box id="reports">
        <AdminResourceLayout
            title="Signalements"
            countLabel={data ? `${filteredData.length} signalement${filteredData.length > 1 ? "s" : ""}${unresolvedCount ? ` dont ${unresolvedCount} non traité${unresolvedCount > 1 ? "s" : ""}` : ""}` : undefined}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher un signalement…"
            searchAriaLabel="Rechercher un signalement par fiche, sujet ou auteur"
            loading={loading}
            loadingLabel="Chargement des signalements..."
            count={filteredData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            toast={toast}
            toastMessage={toastMessage}
            onCloseToast={() => setShowToast(false)}
        >
            {data ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <SortableTableCell scope="col" sortKey="type" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Type</SortableTableCell>
                            <SortableTableCell scope="col" sortKey="name" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Fiche</SortableTableCell>
                            <SortableTableCell scope="col" sortKey="subject" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sujet</SortableTableCell>
                            <SortableTableCell scope="col" sortKey="user" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Signalé par</SortableTableCell>
                            <SortableTableCell scope="col" sortKey="created_at" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reçu le</SortableTableCell>
                            <SortableTableCell scope="col" sortKey="status" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Statut</SortableTableCell>
                            <TableCell scope="col" align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: "center", color: "text.secondary" }}>Aucun signalement trouvé</TableCell>
                            </TableRow>
                        ) : sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((report) => {
                            const { id, reportable_type_slug, reportable_id, reportable_label, subject, message, user, created_at, resolved_at } = report;
                            return (
                                <TableRow hover tabIndex={-1} key={id}>
                                    <TableCell>
                                        <Chip size="small" label={TYPE_LABELS[reportable_type_slug] ?? reportable_type_slug} sx={{ bgcolor: "sageSoft", color: "sageDark", fontWeight: 700 }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        {reportable_label ? (
                                            <Typography
                                                component={RouterLink}
                                                to={`/${reportable_type_slug}/${reportable_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ color: "inherit", fontWeight: "bold" }}
                                            >
                                                {reportable_label}
                                            </Typography>
                                        ) : "Fiche supprimée"}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 280, whiteSpace: "normal", wordBreak: "break-word", display: { xs: 'none', sm: 'table-cell' } }}>
                                        {subject}
                                        {message ? <Typography component="div" variant="body2" color="text.secondary" sx={{ fontSize: "12px", mt: "4px" }}>{message}</Typography> : null}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{user?.username ?? "Utilisateur supprimé"}</TableCell>
                                    <TableCell sx={{ color: "text.secondary", fontSize: "13px", display: { xs: 'none', md: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : "--"}</TableCell>
                                    <TableCell>
                                        {resolved_at ? (
                                            <Chip
                                                size="small"
                                                icon={<CheckCircleIcon fontSize="small" sx={{ color: "sageDark !important" }} />}
                                                label="Traité"
                                                sx={{ bgcolor: "sageSoft", color: "sageDark" }}
                                            />
                                        ) : (
                                            <Chip size="small" variant="outlined" label="En attente" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", justifyContent: "right" }}>
                                            <Tooltip title={resolved_at ? "Déjà traité" : "Marquer comme traité"}>
                                                <span>
                                                    <IconButton
                                                        onClick={() => handleDismiss(report)}
                                                        disabled={!!resolved_at}
                                                        aria-label={`Marquer le signalement de ${reportable_label ?? "cette fiche"} comme traité`}
                                                        size="small"
                                                    >
                                                        <CheckCircleOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            ) : null}
        </AdminResourceLayout>
    </Box>
}

export default Reports;
