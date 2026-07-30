import React, {useEffect, useState} from "react";
import {
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import DeleteUser from "./deleteUser";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";

// The API stores `roles` as a JSON-encoded string column with no model cast,
// so it comes back over the wire as a raw string like '["ROLE_ADMIN"]' rather
// than an actual array — parse it defensively before rendering as chips.
const parseRoles = (roles) => {
    if (Array.isArray(roles)) return roles;
    if (typeof roles === "string") {
        try {
            const parsed = JSON.parse(roles);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            return [roles];
        }
    }
    return [];
};

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

    return <Box id="user">
        <AdminResourceLayout
            title="Utilisateurs"
            countLabel={data ? `${data.length} utilisateur${data.length > 1 ? "s" : ""}` : undefined}
            loading={loading}
            loadingLabel="Chargement des utilisateurs..."
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
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rôles</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créé le</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, username, email, roles, created_at  }) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={username+id}>
                                    <TableCell sx={{fontWeight: 'bold'}}>{username ?? '--'}</TableCell>
                                    <TableCell>{email ?? '--'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {parseRoles(roles).filter(Boolean).map((role) => (
                                                <Chip key={role} size="small" label={role} sx={{ bgcolor: 'sageSoft', color: 'sageDark' }} />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '13px', display: { xs: 'none', lg: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : '--'}</TableCell>
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
            ) : null}
        </AdminResourceLayout>
    </Box>
}

export default User;
