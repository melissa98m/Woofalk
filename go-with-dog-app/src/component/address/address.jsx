import React, {useEffect, useState} from "react";
import {
    Box,
    Container,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Alert
} from "@mui/material";
import DeleteAddress from "./deleteAddress";
import NewAddress from "./newAddress";
import EditAddress from "./editAddress";
import axios from "axios";
import { API_URL } from "../../config";

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

    return <Container sx={{ width : '80%'}} id="address">
        <Paper sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 10}}>
            <Typography variant="h3" sx={{textAlign: "center"}} gutterBottom>Adresses</Typography>
            {loading ? (
                <Typography variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des adresses...</Typography>
            ) : (
                <Box sx={{ maxWidth: '100%' }}>
                    <NewAddress newValue={{data}} handleDataChange={handleDataChange} />
                    <TableContainer sx={{ mt:4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell key={1}>ID</TableCell>
                                    <TableCell key={2}>Nom</TableCell>
                                    <TableCell key={3}>Ville</TableCell>
                                    <TableCell key={4}>Code postal</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }} key={5}>Coordonnées</TableCell>
                                    <TableCell key={6} align={'right'}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, address , city , postal_code , latitude , longitude}) => {
                                    return (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={id}>
                                            <TableCell>{id}</TableCell>
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
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 100]}
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Box>
            )}
        </Paper>

        <Snackbar
            open={toast}
            autoHideDuration={3000}
            onClose={() => setShowToast(false)}
            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        >
            <Alert onClose={() => setShowToast(false)} severity={toastMessage.severity} sx={{width: '100%'}}>
                {toastMessage.message}
            </Alert>
        </Snackbar>
    </Container>
}

export default Address;