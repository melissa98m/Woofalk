import React, {useEffect, useState} from "react";
import {
    Box,
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

function Address() {

    document.title = 'Page des adresses';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
        >
            {data ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Ville</TableCell>
                            <TableCell>Code postal</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Coordonnées</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, address , city , postal_code , latitude , longitude}) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={id}>
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
    </Box>
}

export default Address;
