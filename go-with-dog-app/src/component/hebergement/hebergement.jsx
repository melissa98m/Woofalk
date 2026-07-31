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
import DeleteHebergement from "./deleteHebergement";
import EditHebergement from "./editHebergement";
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

const MAX_VISIBLE_TAGS = 3;

const getSortValue = (hebergement, key) => {
    switch (key) {
        case "hebergement_name": return hebergement.hebergement_name;
        case "address": return hebergement.address?.city;
        case "category": return hebergement.category?.category_name;
        case "tags": return (hebergement.tags ?? []).length;
        case "status": return hebergement.status;
        case "created_at": return hebergement.created_at;
        case "user": return hebergement.user?.username;
        default: return null;
    }
};

function Hebergement() {

    document.title = 'Page des hébergements';

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

    const handleChangePage = (hebergement, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (hebergement) => {
        setRowsPerPage(+hebergement.target.value);
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/hebergements`).then((actualData) => {
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
            setToastMessage({message: "Hébergement modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Hébergement supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    const handleBulkStatus = async (status) => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.patch(`${API_URL}/api/hebergements/bulk-status`, { ids, status });
            setData(data.map((h) => (selection.isSelected(h.id) ? { ...h, status } : h)));
            selection.clear();
            setToastMessage({ message: status === 'publie' ? "Hébergements publiés !" : "Hébergements mis en attente !", severity: "success" });
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
            await axios.delete(`${API_URL}/api/hebergements/bulk`, { data: { ids } });
            setData(data.filter((h) => !selection.isSelected(h.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Hébergements supprimés !", severity: "success" });
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
        return (data ?? []).filter((hebergement) => normalizeText([hebergement.hebergement_name, hebergement.hebergement_description, hebergement.category?.category_name, hebergement.address?.city].filter(Boolean).join(" ")).includes(q));
    }, [data, search]);

    const sortedData = useMemo(
        () => sortRows(filteredData, sort.orderBy, sort.order, getSortValue),
        [filteredData, sort.orderBy, sort.order]
    );
    const pageRows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const pageIds = pageRows.map((h) => h.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="hebergement">
        <AdminResourceLayout
            title="Hébergements"
            countLabel={data ? `${filteredData.length} hébergement${filteredData.length > 1 ? "s" : ""} référencé${filteredData.length > 1 ? "s" : ""}` : undefined}
            actions={<Button component={Link} to="/hebergements/new" variant="contained">Ajouter un hébergement</Button>}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher un hébergement…"
            searchAriaLabel="Rechercher un hébergement par nom"
            loading={loading}
            loadingLabel="Chargement des hébergements..."
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
                    onSelectAll={() => selection.selectAll(filteredData.map((h) => h.id))}
                    onClear={selection.clear}
                >
                    <RowActionButton disabled={bulkLoading} onClick={() => handleBulkStatus('publie')}>Publier</RowActionButton>
                    <RowActionButton disabled={bulkLoading} onClick={() => handleBulkStatus('en_attente')}>Mettre en attente</RowActionButton>
                    <RowActionButton danger disabled={bulkLoading} onClick={() => setShowBulkDelete(true)}>Supprimer la sélection</RowActionButton>
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
                                    slotProps={{ input: { "aria-label": "Sélectionner tous les hébergements de la page" } }}
                                />
                            </TableCell>
                            <SortableTableCell sortKey="hebergement_name" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Nom</SortableTableCell>
                            <SortableTableCell sortKey="address" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Adresse</SortableTableCell>
                            <SortableTableCell sortKey="category" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Categorie</SortableTableCell>
                            <SortableTableCell sortKey="tags" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Tags</SortableTableCell>
                            <SortableTableCell sortKey="status" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Statut</SortableTableCell>
                            <SortableTableCell sortKey="created_at" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', md: 'table-cell' } }}>Date</SortableTableCell>
                            <SortableTableCell sortKey="user" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créateur</SortableTableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} sx={{ textAlign: "center", color: "text.secondary" }}>Aucun hébergement trouvé</TableCell>
                            </TableRow>
                        ) : pageRows.map(({id, hebergement_name, hebergement_description, hebergement_image, hebergement_website, price_indication, status, category, address , user, tags, created_at}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={hebergement_name+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${hebergement_name ?? 'l\'hébergement'}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{hebergement_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{address.address ?? '--'} {address.city ?? '--'} {address.postal_code ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{category.category_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
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
                                            <EditHebergement updateValue={{id, hebergement_name, hebergement_description, hebergement_image, hebergement_website, price_indication, status, category, address, tags, data}} handleDataChange={handleDataChange} />
                                            <DeleteHebergement deleteValue={{id, hebergement_name, hebergement_description, hebergement_image, category, address, data}} handleDataChange={handleDataChange}/>
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
            itemLabel="hébergement"
            itemLabelPlural="hébergements"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Hebergement;
