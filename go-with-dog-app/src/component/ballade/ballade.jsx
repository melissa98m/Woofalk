import React, {useEffect, useState} from "react";
import {
    Box,
    Button,
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


function Ballade() {

    document.title = 'Page des ballades';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
        >
            {data ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
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
                        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, ballade_name, ballade_description, ballade_image, status, tags, ballade_latitude , ballade_longitude , distance , denivele , user, created_at}) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={ballade_name+id}>
                                    <TableCell sx={{fontWeight: 'bold'}}>{ballade_name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ distance ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{ denivele ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {(tags ?? []).map((t) => (
                                                <Chip key={t.id} size="small" label={t.tag_name} sx={{ color: t.color }} />
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
    </Box>
}

export default Ballade;
