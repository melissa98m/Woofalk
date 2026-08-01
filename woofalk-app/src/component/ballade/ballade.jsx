import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Button,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";
import { Link } from "react-router-dom";
import DeleteBallade from "./deleteBallade";
import EditBallade from "./editBallade";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { StatusChip } from "../_partials/_ui/StatusChip";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { SortableTableCell } from "../_partials/_ui/SortableTableCell";
import { useSort, sortRows } from "../_partials/_ui/useSort";
import { normalizeText } from "../../services/search/searchIndex";
import auth from "../../services/auth/token";

const MAX_VISIBLE_TAGS = 3;

const getSortValue = (ballade, key) => {
    switch (key) {
        case "ballade_name": return ballade.ballade_name;
        case "distance": return ballade.distance;
        case "denivele": return ballade.denivele;
        case "tags": return (ballade.tags ?? []).length;
        case "status": return ballade.status;
        case "created_at": return ballade.created_at;
        case "user": return ballade.user?.username;
        default: return null;
    }
};

function Ballade() {

    document.title = 'Page des ballades';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [search, setSearch] = useState("");

    const selection = useRowSelection();
    const sort = useSort();
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    // Moderators can only change a ballade's publication status (see
    // EnsureUserCanModerate server-side) — edit/delete stay admin-only.
    const isModerator = auth.loggedAndModerator();

    const handleChangePage = (ballade, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (ballade) => {
        setRowsPerPage(+ballade.target.value);
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

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
    }, []);

    const handleDataChange = async (dataChange, message) => {
        await setData(dataChange)
        if (message && message === 'edit'){
            setToastMessage({message: "Ballade modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Ballade supprimé !", severity: "success"});
            setShowToast(true);
        }
    }


    const handleBulkStatus = async (status) => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.patch(`${API_URL}/api/ballades/bulk-status`, { ids, status });
            setData(data.map((b) => (selection.isSelected(b.id) ? { ...b, status } : b)));
            selection.clear();
            setToastMessage({ message: status === 'publie' ? "Balades publiées !" : "Balades mises en attente !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.delete(`${API_URL}/api/ballades/bulk`, { data: { ids } });
            setData(data.filter((b) => !selection.isSelected(b.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Balades supprimées !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        const q = normalizeText(search);
        if (q.length === 0) return data ?? [];
        return (data ?? []).filter((ballade) => normalizeText([ballade.ballade_name, ballade.ballade_description].filter(Boolean).join(" ")).includes(q));
    }, [data, search]);

    const sortedData = useMemo(
        () => sortRows(filteredData, sort.orderBy, sort.order, getSortValue),
        [filteredData, sort.orderBy, sort.order]
    );
    const pageRows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const pageIds = pageRows.map((b) => b.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="ballade">
        <AdminResourceLayout
            title="Balades"
            countLabel={data ? `${filteredData.length} balade${filteredData.length > 1 ? "s" : ""} référencée${filteredData.length > 1 ? "s" : ""}` : undefined}
            actions={isModerator ? undefined : <Button component={Link} to="/ballades/new" variant="contained">Ajouter une balade</Button>}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher une balade…"
            searchAriaLabel="Rechercher une balade par nom"
            loading={loading}
            loadingLabel="Chargement des balades..."
            count={filteredData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            toast={toast}
            toastMessage={toastMessage}
            onCloseToast={() => setShowToast(false)}
            bulkBar={data ? (
                <BulkActionsBar
                    count={selection.count}
                    total={filteredData.length}
                    onSelectAll={() => selection.selectAll(filteredData.map((b) => b.id))}
                    onClear={selection.clear}
                >
                    <RowActionButton disabled={bulkLoading} onClick={() => handleBulkStatus('publie')}>Publier</RowActionButton>
                    <RowActionButton disabled={bulkLoading} onClick={() => handleBulkStatus('en_attente')}>Mettre en attente</RowActionButton>
                    {isModerator ? null : (
                        <RowActionButton danger disabled={bulkLoading} onClick={() => setShowBulkDelete(true)}>Supprimer la sélection</RowActionButton>
                    )}
                </BulkActionsBar>
            ) : null}
        >
            {data ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={somePageSelected && !allPageSelected}
                                    checked={allPageSelected}
                                    onChange={(e) => selection.toggleMany(pageIds, e.target.checked)}
                                    slotProps={{ input: { "aria-label": "Sélectionner toutes les balades de la page" } }}
                                />
                            </TableCell>
                            <SortableTableCell sortKey="ballade_name" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Nom</SortableTableCell>
                            <SortableTableCell sortKey="distance" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Distance</SortableTableCell>
                            <SortableTableCell sortKey="denivele" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Denivelé</SortableTableCell>
                            <SortableTableCell sortKey="tags" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Tags</SortableTableCell>
                            <SortableTableCell sortKey="status" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Statut</SortableTableCell>
                            <SortableTableCell sortKey="created_at" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Date</SortableTableCell>
                            <SortableTableCell sortKey="user" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créateur</SortableTableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} sx={{ textAlign: "center", color: "text.secondary" }}>Aucune balade trouvée</TableCell>
                            </TableRow>
                        ) : pageRows.map(({id, ballade_name, ballade_description, ballade_image, status, tags, ballade_latitude , ballade_longitude , distance , denivele , user, created_at}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={ballade_name+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${ballade_name ?? 'la balade'}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{ballade_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ distance ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ denivele ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(tags ?? []).slice(0, MAX_VISIBLE_TAGS).map((t) => (
                                                <Chip
                                                    key={t.id}
                                                    size="small"
                                                    variant="outlined"
                                                    label={truncateLabel(t.tag_name)}
                                                    title={t.tag_name}
                                                    sx={{ bgcolor: 'background.alt', borderColor: t.color, color: t.color }}
                                                />
                                            ))}
                                            {(tags ?? []).length > MAX_VISIBLE_TAGS ? (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={`+${tags.length - MAX_VISIBLE_TAGS}`}
                                                    title={tags.slice(MAX_VISIBLE_TAGS).map((t) => t.tag_name).join(", ")}
                                                />
                                            ) : null}
                                        </Box>
                                    </TableCell>
                                    <TableCell><StatusChip status={status ?? 'publie'} /></TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '13px', display: { xs: 'none', md: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{user?.username ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            {isModerator ? null : (
                                                <>
                                                    <EditBallade updateValue={{id, ballade_name, ballade_description, ballade_image, status, tags, distance, denivele, ballade_latitude, ballade_longitude, data}} handleDataChange={handleDataChange} />
                                                    <DeleteBallade deleteValue={{id, ballade_name, ballade_description, ballade_image, tags, data}} handleDataChange={handleDataChange}/>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            ) : null}
        </AdminResourceLayout>
        <BulkDeleteConfirm
            open={showBulkDelete}
            onClose={() => setShowBulkDelete(false)}
            count={selection.count}
            itemLabel="balade"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Ballade;
