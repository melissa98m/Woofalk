import React, { useEffect, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, Container, Snackbar, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import axios from "axios";
import PlaceIcon from "@mui/icons-material/Place";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import EventIcon from "@mui/icons-material/Event";
import LockResetIcon from "@mui/icons-material/LockReset";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import auth from "../../services/auth/token";
import { API_URL } from "../../config";
import { getLikedPlaces, getLikedBallades } from "../../services/like";
import { PlaceCard } from "../_partials/_ui/PlaceCard";
import { BalladeCard } from "../_partials/_ui/BalladeCard";
import { CrudModal } from "../_partials/_ui/CrudModal";

const gridSx = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: { xs: "16px", md: "22px" },
};

const formatDate = (isoString) =>
    new Date(isoString).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Renders a titled grid of resource cards with consistent loading/empty states,
// used for the four lists on this page (created/liked places and ballades).
function ResourceSection({ headingId, title, icon, loading, items, renderItem, emptyMessage, emptyAction }) {
    return (
        <Box component="section" aria-labelledby={headingId} sx={{ marginTop: { xs: "28px", md: "40px" } }}>
            <Typography
                id={headingId}
                variant="h2"
                sx={{ fontSize: { xs: "22px", md: "26px" }, display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}
            >
                {icon}
                {title}
            </Typography>
            {loading ? (
                <Typography role="status" aria-live="polite" color="text.secondary">Chargement…</Typography>
            ) : items.length === 0 ? (
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ marginBottom: emptyAction ? "12px" : 0 }}>
                        {emptyMessage}
                    </Typography>
                    {emptyAction ? (
                        <Button href={emptyAction.href} variant="outlined" color="secondary" size="small">
                            {emptyAction.label}
                        </Button>
                    ) : null}
                </Box>
            ) : (
                <Box sx={gridSx}>{items.map(renderItem)}</Box>
            )}
        </Box>
    );
}

function Account() {

    document.title = "Mon compte";

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [places, setPlaces] = useState([]);
    const [ballades, setBallades] = useState([]);
    const [likedPlaces, setLikedPlaces] = useState([]);
    const [likedBallades, setLikedBallades] = useState([]);
    const [likesLoading, setLikesLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            axios.get(`${API_URL}/api/current-user`),
            axios.get(`${API_URL}/api/places-user`),
            axios.get(`${API_URL}/api/ballades-user`),
        ]).then(([userRes, placesRes, balladesRes]) => {
            setUser(userRes.data);
            setPlaces(placesRes.data.data);
            setBallades(balladesRes.data.data);
            setError(null);
        }).catch((err) => {
            setError(err.message);
            setUser(null);
        }).finally(() => {
            setLoading(false);
        });

        Promise.all([
            getLikedPlaces().then((res) => setLikedPlaces(res.data.data)),
            getLikedBallades().then((res) => setLikedBallades(res.data.data)),
        ]).finally(() => setLikesLoading(false));
    }, []);

    const handleExport = async () => {
        setExporting(true);
        setActionError("");
        try {
            const res = await axios.get(`${API_URL}/api/users/me/export`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'mes-donnees-woofalk.json';
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setActionError("Impossible de télécharger vos données pour le moment. Réessayez plus tard.");
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        setActionError("");
        try {
            await axios.delete(`${API_URL}/api/users/${user.id}`);
            await axios.post(`${API_URL}/api/logout`).catch(() => {});
            auth.clearSession();
            navigate('/');
        } catch {
            setActionError("Impossible de supprimer votre compte pour le moment. Réessayez plus tard.");
            setDeleting(false);
        }
    };

    return <Container maxWidth="xl" id="home" sx={{ pb: "40px", px: { xs: 2, md: 4 } }}>

        <Typography variant="h1" sx={{ fontSize: { xs: "28px", md: "40px" }, textAlign: "center", marginTop: "20px" }} gutterBottom>
            Mon compte
        </Typography>

        {loading ? (
            <Typography role="status" aria-live="polite" sx={{ textAlign: "center", marginTop: "40px" }}>
                Chargement de votre compte…
            </Typography>
        ) : error || !user ? (
            <Typography role="alert" color="error" sx={{ textAlign: "center", marginTop: "40px" }}>
                Impossible de charger votre compte pour le moment. Merci de réessayer plus tard.
            </Typography>
        ) : (
            <Box
                sx={{
                    bgcolor: "sageSoft",
                    borderRadius: "20px",
                    padding: { xs: "24px 20px", sm: "32px 24px", md: "40px 48px" },
                    marginTop: "24px",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "center", sm: "flex-start" },
                    gap: "24px",
                }}
            >
                <Avatar sx={{ width: 88, height: 88, bgcolor: "terracottaDark", fontSize: "36px", fontWeight: 700 }}>
                    {user.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ textAlign: { xs: "center", sm: "left" }, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }} sx={{ flexWrap: "wrap" }}>
                        <Typography variant="h2" sx={{ fontSize: "24px" }}>{user.username}</Typography>
                        {auth.loggedAndAdmin() ? (
                            <Chip size="small" label="Administrateur" sx={{ bgcolor: "terracottaSoft", color: "terracottaDark", fontWeight: 700 }} />
                        ) : null}
                    </Stack>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap", justifyContent: { xs: "center", sm: "flex-start" }, marginTop: "12px", marginBottom: "20px" }}
                    >
                        <Chip icon={<MailOutlineIcon />} label={user.email} size="small" sx={{ bgcolor: "background.paper" }} />
                        <Chip icon={<EventIcon />} label={`Membre depuis le ${formatDate(user.created_at)}`} size="small" sx={{ bgcolor: "background.paper" }} />
                    </Stack>
                    <Button href="/change-password" variant="contained" color="secondary" startIcon={<LockResetIcon />}>
                        Changer de mot de passe
                    </Button>
                </Box>
            </Box>
        )}

        {user ? (
            <Box component="section" aria-labelledby="privacy-heading" sx={{ marginTop: { xs: "28px", md: "40px" } }}>
                <Typography id="privacy-heading" variant="h2" sx={{ fontSize: { xs: "22px", md: "26px" }, marginBottom: "16px" }}>
                    Vos données personnelles
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    <Button variant="outlined" color="secondary" startIcon={<FileDownloadIcon />} onClick={handleExport} disabled={exporting}>
                        {exporting ? "Préparation…" : "Télécharger mes données"}
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={() => setDeleteOpen(true)}>
                        Supprimer mon compte
                    </Button>
                </Box>
            </Box>
        ) : null}

        <CrudModal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer mon compte" titleId="delete-account-title">
            <Typography sx={{ mb: 3 }}>
                Cette action est irréversible : votre compte, votre adresse email et vos favoris seront définitivement supprimés.
                Les lieux et balades que vous avez créés resteront visibles publiquement, mais ne seront plus associés à votre compte.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</Button>
                <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? "Suppression…" : "Supprimer définitivement"}
                </Button>
            </Box>
        </CrudModal>

        <Snackbar open={!!actionError} autoHideDuration={5000} onClose={() => setActionError("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert onClose={() => setActionError("")} severity="error" sx={{ width: "100%" }}>
                {actionError}
            </Alert>
        </Snackbar>

        <ResourceSection
            headingId="my-places-heading"
            title="Places que vous avez créées"
            icon={<PlaceIcon color="secondary" aria-hidden="true" />}
            loading={loading}
            items={places}
            renderItem={(place) => <PlaceCard key={place.id} place={place} />}
            emptyMessage="Vous n'avez pas encore créé de lieu."
            emptyAction={{ href: "/places/new", label: "Ajouter un lieu" }}
        />

        <ResourceSection
            headingId="my-ballades-heading"
            title="Balades que vous avez créées"
            icon={<DirectionsWalkIcon color="secondary" aria-hidden="true" />}
            loading={loading}
            items={ballades}
            renderItem={(ballade) => <BalladeCard key={ballade.id} ballade={ballade} />}
            emptyMessage="Vous n'avez pas encore créé de balade."
            emptyAction={{ href: "/ballades/new", label: "Ajouter une balade" }}
        />

        <ResourceSection
            headingId="liked-places-heading"
            title="Lieux likés"
            icon={<FavoriteIcon color="error" aria-hidden="true" />}
            loading={likesLoading}
            items={likedPlaces}
            renderItem={(place) => <PlaceCard key={place.id} place={place} />}
            emptyMessage="Vous n'avez encore aimé aucun lieu."
        />

        <ResourceSection
            headingId="liked-ballades-heading"
            title="Balades likées"
            icon={<FavoriteIcon color="error" aria-hidden="true" />}
            loading={likesLoading}
            items={likedBallades}
            renderItem={(ballade) => <BalladeCard key={ballade.id} ballade={ballade} />}
            emptyMessage="Vous n'avez encore aimé aucune balade."
        />

    </Container>

}
export default Account;
