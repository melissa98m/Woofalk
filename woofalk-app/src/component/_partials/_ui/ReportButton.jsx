import { useId, useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    IconButton,
    Radio,
    RadioGroup,
    Snackbar,
    TextField,
    Tooltip,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import FlagIcon from "@mui/icons-material/Flag";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import auth from "../../../services/auth/token";
import { REPORT_SUBJECTS, REPORT_SUBJECT_OTHER, reportItem } from "../../../services/report";

// Report ("signaler") button used on place/ballade/hebergement detail pages,
// next to LikeButton. `type` must match the API resource segment: "places",
// "ballades", or "hebergements". Unlike LikeButton this isn't a toggle — a
// report can't be withdrawn — so it opens a dialog to collect a subject
// (required) before submitting, instead of firing on click.
export function ReportButton({ type, id, reported, onChange, size = "medium" }) {
    const [open, setOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [confirmation, setConfirmation] = useState(false);
    const titleId = useId();
    const isLoggedIn = auth.loggedAndUser() || auth.loggedAndAdmin();

    if (!isLoggedIn) {
        return (
            <Tooltip title="Connectez-vous pour signaler ce contenu">
                <IconButton
                    component={RouterLink}
                    to="/login"
                    aria-label="Se connecter pour signaler ce contenu"
                    size={size}
                >
                    <FlagOutlinedIcon fontSize={size} />
                </IconButton>
            </Tooltip>
        );
    }

    if (reported) {
        return (
            <Tooltip title="Vous avez déjà signalé ce contenu">
                <span>
                    <IconButton aria-label="Vous avez déjà signalé ce contenu" disabled size={size}>
                        <FlagIcon fontSize={size} color="warning" />
                    </IconButton>
                </span>
            </Tooltip>
        );
    }

    const openDialog = () => {
        setSubject("");
        setMessage("");
        setError(null);
        setOpen(true);
    };

    const closeDialog = () => {
        if (pending) return;
        setOpen(false);
    };

    const submit = async () => {
        if (pending || !subject) return;
        setPending(true);
        setError(null);
        try {
            await reportItem(type, id, subject, subject === REPORT_SUBJECT_OTHER ? message : undefined);
            onChange?.({ reported: true });
            setOpen(false);
            setConfirmation(true);
        } catch (err) {
            setError(
                err.response?.status === 409
                    ? "Vous avez déjà signalé ce contenu."
                    : "Une erreur est survenue, veuillez réessayer."
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <>
            <Tooltip title="Signaler ce contenu">
                <IconButton onClick={openDialog} aria-label="Signaler ce contenu" size={size}>
                    <FlagOutlinedIcon fontSize={size} />
                </IconButton>
            </Tooltip>
            <Dialog open={open} onClose={closeDialog} aria-labelledby={titleId} maxWidth="xs" fullWidth>
                <DialogTitle id={titleId}>Signaler ce contenu</DialogTitle>
                <DialogContent>
                    <FormControl component="fieldset" sx={{ mt: 1 }}>
                        <FormLabel component="legend">Motif du signalement</FormLabel>
                        <RadioGroup value={subject} onChange={(e) => setSubject(e.target.value)}>
                            {REPORT_SUBJECTS.map((s) => (
                                <FormControlLabel key={s} value={s} control={<Radio />} label={s} />
                            ))}
                        </RadioGroup>
                    </FormControl>
                    {subject === REPORT_SUBJECT_OTHER ? (
                        <TextField
                            label="Précisez votre signalement"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            multiline
                            minRows={3}
                            fullWidth
                            sx={{ mt: 2 }}
                        />
                    ) : null}
                    {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={pending}>Annuler</Button>
                    <Button
                        onClick={submit}
                        variant="contained"
                        disabled={pending || !subject || (subject === REPORT_SUBJECT_OTHER && !message.trim())}
                    >
                        Envoyer
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={confirmation}
                autoHideDuration={4000}
                onClose={() => setConfirmation(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setConfirmation(false)} severity="success" sx={{ width: "100%" }}>
                    Merci, votre signalement a été envoyé.
                </Alert>
            </Snackbar>
        </>
    );
}

export default ReportButton;
