import React, {useEffect, useMemo, useState} from "react";
import {
    Box,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import DeleteCategory from "./deleteCategory";
import NewCategory from "./newCategory";
import EditCategory from "./editCategory";
import axios from "axios";
import { API_URL } from "../../config";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import { useRowSelection } from "../_partials/_ui/useRowSelection";
import { BulkActionsBar } from "../_partials/_ui/BulkActionsBar";
import { BulkDeleteConfirm } from "../_partials/_ui/BulkDeleteConfirm";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { SortableTableCell } from "../_partials/_ui/SortableTableCell";
import { useSort, sortRows } from "../_partials/_ui/useSort";
import { normalizeText } from "../../services/search/searchIndex";

const scopeLabels = {place: 'Lieux', hebergement: 'Hébergements', both: 'Lieux et hébergements'};

const getSortValue = (category, key) => {
    switch (key) {
        case "category_name": return category.category_name;
        case "scope": return scopeLabels[category.scope] ?? scopeLabels.place;
        default: return null;
    }
};

function Category() {

    document.title = 'Page des categories';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [search, setSearch] = useState("");

    const selection = useRowSelection();
    const sort = useSort();
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/categories`).then((actualData) => {
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
            setToastMessage({message: "Categorie modifié !", severity: "success"});
            setShowToast(true);
        } else if(message && message === 'delete') {
            setToastMessage({message: "Categorie supprimé !", severity: "success"});
            setShowToast(true);
        }
    }

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected);
        setBulkLoading(true);
        try {
            await axios.delete(`${API_URL}/api/categories/bulk`, {
                headers: { "Authorization": "Bearer" + localStorage.getItem('access_token') },
                data: { ids },
            });
            setData(data.filter((c) => !selection.isSelected(c.id)));
            selection.clear();
            setShowBulkDelete(false);
            setToastMessage({ message: "Catégories supprimées !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setBulkLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        const q = normalizeText(search);
        if (q.length === 0) return data ?? [];
        return (data ?? []).filter((c) => normalizeText(c.category_name).includes(q));
    }, [data, search]);

    const sortedData = useMemo(
        () => sortRows(filteredData, sort.orderBy, sort.order, getSortValue),
        [filteredData, sort.orderBy, sort.order]
    );
    const pageRows = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const pageIds = pageRows.map((c) => c.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
    const somePageSelected = pageIds.some((id) => selection.isSelected(id));

    return <Box id="category">
        <AdminResourceLayout
            title="Catégories"
            countLabel={data ? `${filteredData.length} catégorie${filteredData.length > 1 ? "s" : ""}` : undefined}
            actions={<NewCategory newValue={{data}} handleDataChange={handleDataChange} />}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher une catégorie…"
            searchAriaLabel="Rechercher une catégorie par nom"
            loading={loading}
            loadingLabel="Chargement des categories..."
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
                    total={filteredData.length}
                    onSelectAll={() => selection.selectAll(filteredData.map((c) => c.id))}
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
                                    slotProps={{ input: { "aria-label": "Sélectionner toutes les catégories de la page" } }}
                                />
                            </TableCell>
                            <SortableTableCell sortKey="category_name" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort}>Nom</SortableTableCell>
                            <SortableTableCell sortKey="scope" orderBy={sort.orderBy} order={sort.order} onSort={sort.toggleSort} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>S'applique à</SortableTableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: "center", color: "text.secondary" }}>Aucune catégorie trouvée</TableCell>
                            </TableRow>
                        ) : pageRows.map(({id, category_name, scope}) => {
                            return (
                                <TableRow hover selected={selection.isSelected(id)} tabIndex={-1} key={category_name+id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selection.isSelected(id)}
                                            onChange={() => selection.toggle(id)}
                                            slotProps={{ input: { "aria-label": `Sélectionner ${category_name}` } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>{category_name}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{scopeLabels[scope] ?? scopeLabels.place}</TableCell>
                                    <TableCell>
                                        <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <EditCategory updateValue={{id, category_name, scope, data}} handleDataChange={handleDataChange} />
                                            <DeleteCategory deleteValue={{id, category_name, data}} handleDataChange={handleDataChange}/>
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
            itemLabel="catégorie"
            itemLabelPlural="catégories"
            onConfirm={handleBulkDelete}
        />
    </Box>
}

export default Category;
