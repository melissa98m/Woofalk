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


function Ballade() {

    document.title = 'Page des ballades';

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

    const handleChangePage = (ballade, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (ballade) => {
        setRowsPerPage(+ballade.target.value);
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

    const authHeaders = { headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') } };

    const handleBulkStatus = async (status) => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.patch(`${API_URL}/api/ballades/bulk-status`, { ids, status }, authHeaders);
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
            await axios.delete(`${API_URL}/api/ballades/bulk`, { ...authHeaders, data: { ids } });
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

    const pageRows = data ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];
    const pageIds = pageRows.map((b) => b.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="ballade">
        <AdminResourceLayout
            title="Balades"
            countLabel={data ? `${data.length} balade${data.length > 1 ? "s" : ""} référencée${data.length > 1 ? "s" : ""}` : undefined}
            actions={<Button component={Link} to="/ballades/new" variant="contained">Ajouter une balade</Button>}
            loading={loading}
            loadingLabel="Chargement des balades..."
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
                    onSelectAll={() => selection.selectAll(data.map((b) => b.id))}
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
                                    inputProps={{ "aria-label": "Sélectionner toutes les balades de la page" }}
                                />
                            </TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Distance</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Denivelé</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créateur</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.map(({id, ballade_name, ballade_description, ballade_image, status, tags, ballade_latitude , ballade_longitude , distance , denivele , user, created_at}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={ballade_name+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            inputProps={{ "aria-label": `Sélectionner ${ballade_name ?? 'la balade'}` }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{ballade_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ distance ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ denivele ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(tags ?? []).map((t) => (
                                                <Chip key={t.id} size="small" label={truncateLabel(t.tag_name)} title={t.tag_name} sx={{ color: t.color }} />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell><StatusChip status={status ?? 'publie'} /></TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '13px', display: { xs: 'none', md: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{user.username ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <EditBallade updateValue={{id, ballade_name, ballade_description, ballade_image, status, tags, distance, denivele, ballade_latitude, ballade_longitude, data}} handleDataChange={handleDataChange} />
                                            <DeleteBallade deleteValue={{id, ballade_name, ballade_description, ballade_image, tags, data}} handleDataChange={handleDataChange}/>
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
