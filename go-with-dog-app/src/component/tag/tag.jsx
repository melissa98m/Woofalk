import React, {useEffect, useState} from "react";
import {
    Box,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import DeleteTag from "./deleteTag";
import NewTag from "./newTag";
import EditTag from "./editTag";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";

function Tag() {

    document.title = 'Page des tags';

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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/tags`).then((actualData) => {
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
            setToastMessage({message: "Tag modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Tag supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    const scopeLabels = {place: 'Lieux', ballade: 'Balades', both: 'Lieux et balades'};

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.delete(`${API_URL}/api/tags/bulk`, {
                headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') },
                data: { ids },
            });
            setData(data.filter((t) => !selection.isSelected(t.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Tags supprimés !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const pageRows = data ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];
    const pageIds = pageRows.map((t) => t.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="tag">
        <AdminResourceLayout
            title="Tags des ballades"
            countLabel={data ? `${data.length} tag${data.length > 1 ? "s" : ""}` : undefined}
            actions={<NewTag newValue={{data}} handleDataChange={handleDataChange} />}
            loading={loading}
            loadingLabel="Chargement des tags..."
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
                    onSelectAll={() => selection.selectAll(data.map((t) => t.id))}
                    onClear={selection.clear}
                >
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
                                    slotProps={{ input: { "aria-label": "Sélectionner tous les tags de la page" } }}
                                />
                            </TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Couleur</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>S'applique à</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.map(({id, tag_name , color, scope}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${tag_name}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{tag_name}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: color, border: '1px solid', borderColor: 'divider' }} />
                                            <Typography variant="body2" color="text.secondary">{color}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{scopeLabels[scope] ?? scopeLabels.both}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <EditTag updateValue={{id, tag_name,color, scope, data}} handleDataChange={handleDataChange} />
                                            <DeleteTag deleteValue={{id, tag_name, data}} handleDataChange={handleDataChange}/>
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
            itemLabel="tag"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Tag;
