import React, {useEffect, useState} from "react";
import {
    Box,
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

function Tag() {

    document.title = 'Page des tags';

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
        >
            {data ? (
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom</TableCell>
                            <TableCell>Couleur</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(({id, tag_name , color}) => {
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={id}>
                                    <TableCell sx={{fontWeight: 'bold'}}>{tag_name}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: color, border: '1px solid', borderColor: 'divider' }} />
                                            <Typography variant="body2" color="text.secondary">{color}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <EditTag updateValue={{id, tag_name,color, data}} handleDataChange={handleDataChange} />
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
    </Box>
}

export default Tag;
