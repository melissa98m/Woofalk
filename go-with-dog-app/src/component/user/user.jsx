import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Checkbox,
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
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import auth from "../../services/auth/token";
import { normalizeText } from "../../services/search/searchIndex";

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
    const [search, setSearch] = useState("");

    const selection = useRowSelection();
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const currentUserId = Number(auth.getUserId());

    const handleChangePage = (user, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (user) => {
        setRowsPerPage(+user.target.value);
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
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

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.delete(`${API_URL}/api/users/bulk`, {
                headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') },
                data: { ids },
            });
            setData(data.filter((u) => !selection.isSelected(u.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Utilisateurs supprimés !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    // Admins can never select their own account for a bulk action — the API
    // silently excludes it too, but disabling the checkbox avoids a
    // confusing "N sélectionnés" count that includes an account that won't
    // actually be deleted.
    const filteredData = useMemo(() => {
        const q = normalizeText(search);
        if (q.length === 0) return data ?? [];
        return (data ?? []).filter((u) => normalizeText([u.username, u.email].filter(Boolean).join(" ")).includes(q));
    }, [data, search]);

    const pageRows = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const selectablePageIds = pageRows.filter((u) => u.id !== currentUserId).map((u) => u.id);
    const allPageSelected = selectablePageIds.length > 0 && selectablePageIds.every((id) => selection.isSelected(id));
    const somePageSelected = selectablePageIds.some((id) => selection.isSelected(id));

    return <Box id="user">
        <AdminResourceLayout
            title="Utilisateurs"
            countLabel={data ? `${filteredData.length} utilisateur${filteredData.length > 1 ? "s" : ""}` : undefined}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher un utilisateur…"
            searchAriaLabel="Rechercher un utilisateur par nom ou email"
            loading={loading}
            loadingLabel="Chargement des utilisateurs..."
            count={filteredData.length}
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
                    total={filteredData.filter((u) => u.id !== currentUserId).length}
                    onSelectAll={() => selection.selectAll(filteredData.filter((u) => u.id !== currentUserId).map((u) => u.id))}
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
                                    onChange={(e) => selection.toggleMany(selectablePageIds, e.target.checked)}
                                    slotProps={{ input: { "aria-label": "Sélectionner tous les utilisateurs de la page" } }}
                                />
                            </TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                            <TableCell>Rôles</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Créé le</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: "center", color: "text.secondary" }}>Aucun utilisateur trouvé</TableCell>
                            </TableRow>
                        ) : pageRows.map(({id, username, email, roles, created_at  }) => {
                            const isSelf = id === currentUserId;
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={username+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            disabled={isSelf}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${username ?? "l'utilisateur"}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{username ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{email ?? '--'}</TableCell>
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
        <BulkDeleteConfirm
            open={showBulkDelete}
            onClose={() => setShowBulkDelete(false)}
            count={selection.count}
            itemLabel="utilisateur"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default User;
