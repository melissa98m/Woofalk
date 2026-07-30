import React, {useEffect, useState} from "react";
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
import DeletePlace from "./deletePlace";
import EditPlace from "./editPlace";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { StatusChip } from "../_partials/_ui/StatusChip";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";

const MAX_VISIBLE_TAGS = 3;

function Place() {

    document.title = 'Page des places';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const selection = useRowSelection();
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    const handleChangePage = (place, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (place) => {
        setRowsPerPage(+place.target.value);
        setPage(0);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/places`).then((actualData) => {
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
            setToastMessage({message: "Place modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Place supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    const authHeaders = { headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') } };

    const handleBulkStatus = async (status) => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.patch(`${API_URL}/api/places/bulk-status`, { ids, status }, authHeaders);
            setData(data.map((p) => (selection.isSelected(p.id) ? { ...p, status } : p)));
            selection.clear();
            setToastMessage({ message: status === 'publie' ? "Lieux publiés !" : "Lieux mis en attente !", severity: "success" });
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
            await axios.delete(`${API_URL}/api/places/bulk`, { ...authHeaders, data: { ids } });
            setData(data.filter((p) => !selection.isSelected(p.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Lieux supprimés !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const pageRows = data ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];
    const pageIds = pageRows.map((p) => p.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="place">
        <AdminResourceLayout
            title="Lieux"
            countLabel={data ? `${data.length} lieu${data.length > 1 ? "x" : ""} référencé${data.length > 1 ? "s" : ""}` : undefined}
            actions={<Button component={Link} to="/places/new" variant="contained">Ajouter un lieu</Button>}
            loading={loading}
            loadingLabel="Chargement des places..."
            count={data ? data.length : 0}
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
                    total={data.length}
                    onSelectAll={() => selection.selectAll(data.map((p) => p.id))}
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
                                    slotProps={{ input: { "aria-label": "Sélectionner tous les lieux de la page" } }}
                                />
                            </TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Adresse</TableCell>
                            <TableCell>Categorie</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Tags</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créateur</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.map(({id, place_name, place_description, place_image, status, category, address , user, tags, created_at}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={place_name+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${place_name ?? 'le lieu'}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{place_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{address.address ?? '--'} {address.city ?? '--'} {address.postal_code ?? '--'}</TableCell>
                                    <TableCell>{category.category_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(tags ?? []).slice(0, MAX_VISIBLE_TAGS).map((t) => (
                                                <Chip key={t.id} size="small" label={truncateLabel(t.tag_name)} title={t.tag_name} />
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
                                            <EditPlace updateValue={{id, place_name, place_description, place_image, status, category, address, tags, data}} handleDataChange={handleDataChange} />
                                            <DeletePlace deleteValue={{id, place_name, place_description, place_image, category, address, data}} handleDataChange={handleDataChange}/>
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
            itemLabel="lieu"
            itemLabelPlural="lieux"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Place;
