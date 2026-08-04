import { useEffect, useId, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import auth from "../../../services/auth/token";
import { addComment, deleteComment, getComments, updateComment } from "../../../services/comment";
import { LikeButton } from "./LikeButton";

const MAX_LENGTH = 1000;

function formatDate(value) {
    return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Comment ("commentaire") section used on place/ballade/hebergement detail
// pages, below the description. `type` must match the API resource segment:
// "places", "ballades", or "hebergements". Each comment can itself be liked
// via LikeButton with type="comments" — the API exposes the same like/unlike
// shape for comments as it does for listings.
export function CommentSection({ type, id }) {
    const [comments, setComments] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newBody, setNewBody] = useState("");
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editBody, setEditBody] = useState("");
    const [editError, setEditError] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const headingId = useId();
    const deleteTitleId = useId();

    const isLoggedIn = auth.loggedAndUser() || auth.loggedAndCanModerate();
    const currentUserId = auth.getUserId();
    const canModerate = auth.loggedAndCanModerate();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getComments(type, id)
            .then((res) => {
                if (!cancelled) setComments(res.data.data);
            })
            .catch(() => {
                if (!cancelled) setComments([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [type, id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = newBody.trim();
        if (!body || posting) return;
        setPosting(true);
        setPostError(null);
        try {
            const res = await addComment(type, id, body);
            setComments((current) => [res.data.data, ...(current ?? [])]);
            setNewBody("");
        } catch {
            setPostError("Impossible de publier votre commentaire, veuillez réessayer.");
        } finally {
            setPosting(false);
        }
    };

    const startEdit = (comment) => {
        setEditingId(comment.id);
        setEditBody(comment.body);
        setEditError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditBody("");
        setEditError(null);
    };

    const saveEdit = async (comment) => {
        const body = editBody.trim();
        if (!body) return;
        try {
            const res = await updateComment(comment.id, body);
            setComments((current) => current.map((c) => (c.id === comment.id ? { ...c, ...res.data.data } : c)));
            setEditingId(null);
            setEditBody("");
        } catch {
            setEditError("Impossible de modifier ce commentaire, veuillez réessayer.");
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await deleteComment(pendingDelete.id);
            setComments((current) => current.filter((c) => c.id !== pendingDelete.id));
            setPendingDelete(null);
            setDeleteError(null);
        } catch {
            setDeleteError("Impossible de supprimer ce commentaire, veuillez réessayer.");
        }
    };

    const handleLikeChange = (comment, { liked, likesCount }) => {
        setComments((current) => current.map((c) => (c.id === comment.id ? { ...c, is_liked: liked, likes_count: likesCount } : c)));
    };

    return (
        <Box component="section" aria-labelledby={headingId} sx={{ mt: "32px" }}>
            <Typography variant="h2" id={headingId} sx={{ fontSize: "20px", marginBottom: "16px" }}>
                Commentaires{comments ? ` (${comments.length})` : ""}
            </Typography>

            {isLoggedIn ? (
                <Box component="form" onSubmit={handleSubmit} sx={{ mb: "24px" }}>
                    <TextField
                        label="Laisser un commentaire"
                        placeholder="Partagez votre expérience..."
                        multiline
                        minRows={2}
                        fullWidth
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
                        disabled={posting}
                    />
                    {postError ? <Alert severity="error" sx={{ mt: 1 }}>{postError}</Alert> : null}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "8px" }}>
                        <Button type="submit" variant="contained" disabled={posting || !newBody.trim()}>
                            Publier
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Typography sx={{ mb: "24px", fontSize: "14px", color: "text.secondary" }}>
                    <Typography component={RouterLink} to="/login" sx={{ color: "primary.main", fontWeight: 600 }}>
                        Connectez-vous
                    </Typography>{" "}
                    pour laisser un commentaire.
                </Typography>
            )}

            {loading ? (
                <Typography role="status" aria-live="polite" sx={{ color: "text.secondary" }}>Chargement des commentaires...</Typography>
            ) : comments && comments.length > 0 ? (
                <Stack divider={<Divider />} spacing="16px">
                    {comments.map((comment) => {
                        const isOwner = !!currentUserId && comment.user?.id === currentUserId;
                        const isEditing = editingId === comment.id;
                        return (
                            <Box key={comment.id} sx={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: "14px", bgcolor: "sageSoft", color: "sageDark" }}>
                                    {comment.user?.username?.[0]?.toUpperCase() ?? "?"}
                                </Avatar>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: "14px" }}>
                                            {comment.user?.username ?? "Utilisateur supprimé"}
                                        </Typography>
                                        <Typography component="time" dateTime={comment.created_at} sx={{ fontSize: "12px", color: "text.secondary" }}>
                                            {formatDate(comment.created_at)}
                                        </Typography>
                                    </Box>
                                    {isEditing ? (
                                        <Box sx={{ mt: "6px" }}>
                                            <TextField
                                                label={`Modifier le commentaire de ${comment.user?.username ?? "utilisateur"}`}
                                                multiline
                                                minRows={2}
                                                fullWidth
                                                value={editBody}
                                                onChange={(e) => setEditBody(e.target.value)}
                                                slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
                                            />
                                            {editError ? <Alert severity="error" sx={{ mt: 1 }}>{editError}</Alert> : null}
                                            <Box sx={{ display: "flex", gap: "8px", justifyContent: "flex-end", mt: "8px" }}>
                                                <Button size="small" onClick={cancelEdit}>Annuler</Button>
                                                <Button size="small" variant="contained" onClick={() => saveEdit(comment)} disabled={!editBody.trim()}>
                                                    Enregistrer
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography sx={{ fontSize: "14px", mt: "4px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                            {comment.body}
                                        </Typography>
                                    )}
                                    {!isEditing ? (
                                        <Box sx={{ display: "flex", alignItems: "center", mt: "2px" }}>
                                            <LikeButton
                                                type="comments"
                                                id={comment.id}
                                                liked={!!comment.is_liked}
                                                likesCount={comment.likes_count ?? 0}
                                                size="small"
                                                onChange={(next) => handleLikeChange(comment, next)}
                                            />
                                            {isOwner ? (
                                                <Tooltip title="Modifier">
                                                    <IconButton size="small" sx={{ p: "12px" }} onClick={() => startEdit(comment)} aria-label="Modifier ce commentaire">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                            {isOwner || canModerate ? (
                                                <Tooltip title="Supprimer">
                                                    <IconButton size="small" sx={{ p: "12px" }} onClick={() => setPendingDelete(comment)} aria-label="Supprimer ce commentaire">
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                        </Box>
                                    ) : null}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            ) : (
                <Typography sx={{ color: "text.secondary", fontSize: "14px" }}>
                    Aucun commentaire pour le moment. Soyez le premier à en laisser un !
                </Typography>
            )}

            <Dialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} aria-labelledby={deleteTitleId} maxWidth="xs" fullWidth>
                <DialogTitle id={deleteTitleId}>Supprimer ce commentaire ?</DialogTitle>
                <DialogContent>
                    <Typography>Cette action est définitive.</Typography>
                    {deleteError ? <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPendingDelete(null)}>Annuler</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Supprimer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CommentSection;
