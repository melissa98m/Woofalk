import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import update from "immutability-helper";
import { API_URL } from "../../config";
import auth from "../../services/auth/token";
import { AdminResourceLayout } from "../_partials/_admin/AdminResourceLayout";
import ReplyContact from "./replyContact";
import { normalizeText } from "../../services/search/searchIndex";

// Admin listing of every contact-form submission. The API already returns
// them sorted subject-first with reports ("Signaler un lieu", is_report)
// pinned ahead of everything else — this component just renders that order
// and marks report rows in red so they can't be missed at a glance.
function ContactMessages() {

    document.title = 'Messages de contact';

    const [data, setData] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // WIP
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [search, setSearch] = useState("");

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
        axios.get(`${API_URL}/api/contacts`, {
            headers: { Authorization: `Bearer ${auth.getToken()}` },
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

    const filteredData = useMemo(() => {
        const q = normalizeText(search);
        if (q.length === 0) return data ?? [];
        return (data ?? []).filter((contact) => normalizeText([contact.name, contact.email, contact.subject, contact.contenu].filter(Boolean).join(" ")).includes(q));
    }, [data, search]);

    const reportCount = filteredData.filter((contact) => contact.is_report).length;

    const handleReplied = (updatedContact) => {
        setData((current) => {
            const foundIndex = current.findIndex((c) => c.id === updatedContact.id);
            return update(current, { [foundIndex]: { $set: updatedContact } });
        });
    };

    return <Box id="contact-messages">
        <AdminResourceLayout
            title="Messages de contact"
            countLabel={data ? `${filteredData.length} message${filteredData.length > 1 ? "s" : ""}${reportCount ? ` dont ${reportCount} signalement${reportCount > 1 ? "s" : ""}` : ""}` : undefined}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Rechercher un message…"
            searchAriaLabel="Rechercher un message par nom, email ou contenu"
            loading={loading}
            loadingLabel="Chargement des messages..."
            count={filteredData.length}
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
                            <TableCell scope="col">Nom</TableCell>
                            <TableCell scope="col" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                            <TableCell scope="col" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Sujet</TableCell>
                            <TableCell scope="col" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Message</TableCell>
                            <TableCell scope="col" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Reçu le</TableCell>
                            <TableCell scope="col">Statut</TableCell>
                            <TableCell scope="col" align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ textAlign: "center", color: "text.secondary" }}>Aucun message trouvé</TableCell>
                            </TableRow>
                        ) : filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((contact) => {
                            const { id, name, email, subject, contenu, is_report, created_at, replied_at } = contact;
                            return (
                                <TableRow
                                    hover
                                    tabIndex={-1}
                                    key={id}
                                    sx={is_report ? {
                                        bgcolor: 'coralSoft',
                                        borderLeft: '4px solid',
                                        borderLeftColor: 'coral',
                                    } : undefined}
                                >
                                    <TableCell sx={{ fontWeight: 'bold' }}>{name ?? '--'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{email}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                            <Chip
                                                size="small"
                                                label={subject}
                                                sx={{ bgcolor: is_report ? 'coral' : 'sageSoft', color: is_report ? '#fff' : 'sageDark' }}
                                            />
                                            {is_report ? (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    icon={<ReportProblemIcon fontSize="small" sx={{ color: 'coral !important' }} />}
                                                    label="Prioritaire"
                                                    aria-label="Signalement, message prioritaire"
                                                    sx={{ borderColor: 'coral', color: 'coral', fontWeight: 700 }}
                                                />
                                            ) : null}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 320, whiteSpace: 'normal', wordBreak: 'break-word', display: { xs: 'none', md: 'table-cell' } }}>{contenu}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '13px', display: { xs: 'none', md: 'table-cell' } }}>{created_at ? created_at.slice(0, 10) : '--'}</TableCell>
                                    <TableCell>
                                        {replied_at ? (
                                            <Chip
                                                size="small"
                                                icon={<CheckCircleIcon fontSize="small" sx={{ color: 'sageDark !important' }} />}
                                                label="Répondu"
                                                sx={{ bgcolor: 'sageSoft', color: 'sageDark' }}
                                            />
                                        ) : (
                                            <Chip size="small" variant="outlined" label="En attente" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', justifyContent: 'right' }}>
                                            <ReplyContact contact={contact} onReplied={handleReplied} />
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

export default ContactMessages;
