import React, {useEffect, useState} from "react";
import {
    Box,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import DeleteAddress from "./deleteAddress";
import NewAddress from "./newAddress";
import EditAddress from "./editAddress";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";

function Address() {

    document.title = 'Page des adresses';

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
        axios.get(`${API_URL}/api/addresses`).then((actualData) => {
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
            setToastMessage({message: "Adresse modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Adresse supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.delete(`${API_URL}/api/addresses/bulk`, {
                headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') },
                data: { ids },
            });
            setData(data.filter((a) => !selection.isSelected(a.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Adresses supprimées !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const pageRows = data ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : [];
    const pageIds = pageRows.map((a) => a.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="address">
        <AdminResourceLayout
            title="Adresses"
            countLabel={data ? `${data.length} adresse${data.length > 1 ? "s" : ""}` : undefined}
            actions={<NewAddress newValue={{data}} handleDataChange={handleDataChange} />}
            loading={loading}
            loadingLabel="Chargement des adresses..."
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
                    onSelectAll={() => selection.selectAll(data.map((a) => a.id))}
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
                                    slotProps={{ input: { "aria-label": "Sélectionner toutes les adresses de la page" } }}
                                />
                            </TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Ville</TableCell>
                            <TableCell>Code postal</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Coordonnées</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.map(({id, address , city , postal_code , latitude , longitude}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${address ?? "l'adresse"}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{address ?? '--'}</TableCell>
                                    <TableCell>{city ?? '--'}</TableCell>
                                    <TableCell>{postal_code ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{latitude ?? '--'} , {longitude ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <EditAddress updateValue={{id, address, city, postal_code, latitude, longitude , data}} handleDataChange={handleDataChange} />
                                            <DeleteAddress deleteValue={{id, address, data}} handleDataChange={handleDataChange}/>
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
            itemLabel="adresse"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Address;
