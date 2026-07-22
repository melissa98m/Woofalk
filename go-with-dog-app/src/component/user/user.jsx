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
    Alert, Avatar
} from "@mui/material";
import DeleteUser from "./deleteUser";
import axios from "axios";
import { API_URL } from "../../config";


function User() {

    document.title = 'Page des users';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleChangePage = (user, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (user) => {
        setRowsPerPage(+user.target.value);
        setPage(0);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/users`
        , {
         "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
        }).then((actualData) => {
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
            setToastMessage({message: "Utilisateur modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Utilisateur supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    return <Container sx={{ width : '80%'}} id="user">
        <Paper sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 10}}>
            <Typography variant="h3" sx={{textAlign: "center"}} gutterBottom>Utilisateurs</Typography>
            {loading ? (
                <Typography variant="h5" sx={{textAlign: "center"}} gutterBottom>Chargement des utilisateurs...</Typography>
            ) : (
                <Box sx={{ maxWidth: '90%' }}>
                    <TableContainer sx={{ mt:4 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell key={1}>ID</TableCell>
                                    <TableCell key={2}>Username</TableCell>
                                    <TableCell key={3}>Email</TableCell>
                                    <TableCell key={4}>Roles</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }} key={5}>Créer le</TableCell>
                                    <TableCell key={6} align={'right'}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, username, email, roles, created_at  }) => {
                                    return (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={username+id}>
                                            <TableCell>{id}</TableCell>
                                            <TableCell sx={{fontWeight: 'bold'}}>{username ?? '--'}</TableCell>
                                            <TableCell sx={{fontWeight: 'bold'}}>{email ?? '--'}</TableCell>
                                            <TableCell sx={{fontWeight: 'bold'}}>{ roles ?? '--'}</TableCell>
                                             <TableCell sx={{fontWeight: 'bold' , display: { xs: 'none', lg: 'table-cell' } }}>{ created_at.slice(0, 16)  ?? '--'}</TableCell>
                                            <TableCell>
                                                <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                                    <DeleteUser deleteValue={{id, username, email , roles, data}} handleDataChange={handleDataChange}/>
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

export default User;