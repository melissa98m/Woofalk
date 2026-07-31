import { Alert, Box, Button, FormControl, Snackbar, TextField, Typography } from "@mui/material";
import { Reply } from "@mui/icons-material";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

// Lets an admin answer a contact-form message without leaving the dashboard:
// the reply is emailed to the sender by the API (App\Mail\ContactReply) and
// the row is stamped with replied_at so the list can show it as answered.
function ReplyContact({ contact, onReplied }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { message: "" },
    });

    const sendReply = async (values) => {
        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/contacts/${contact.id}/reply`, values);
            onReplied(res.data.data);
            setOpen(false);
            reset();
            setToastMessage({ message: "Réponse envoyée !", severity: "success" });
            setShowToast(true);
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue, réessayez plus tard.", severity: "error" });
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ display: "inline-block" }}>
            <RowActionButton icon={<Reply fontSize="small" />} onClick={() => setOpen(true)}>
                {contact.replied_at ? "Répondre à nouveau" : "Répondre"}
            </RowActionButton>
            <CrudModal open={open} onClose={() => setOpen(false)} title={`Répondre à ${contact.name ?? contact.email}`} titleId="reply-contact-title">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Message reçu ({contact.subject}) :</strong> {contact.contenu}
                </Typography>
                <form onSubmit={handleSubmit(sendReply)}>
                    <FormControl fullWidth>
                        <Controller
                            name="message"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("message", { required: "Ce champ est requis" })}
                                    label="Votre réponse"
                                    variant="outlined"
                                    multiline
                                    rows={6}
                                    fullWidth
                                    slotProps={{ htmlInput: { maxLength: 5000 } }}
                                    error={!!errors.message}
                                    aria-required="true"
                                />
                            )}
                        />
                        {errors.message ? (
                            <Alert sx={{ mt: 2, p: 0, pl: 2 }} severity="error">{errors.message?.message}</Alert>
                        ) : null}
                        <Box className="action-button">
                            <Button type="submit" sx={{ m: 3 }} variant="contained" disabled={submitting}>
                                {submitting ? "Envoi…" : "Envoyer la réponse"}
                            </Button>
                        </Box>
                    </FormControl>
                </form>
            </CrudModal>
            <Snackbar
                open={toast}
                autoHideDuration={3000}
                onClose={() => setShowToast(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setShowToast(false)} severity={toastMessage.severity} sx={{ width: "100%" }}>
                    {toastMessage.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default ReplyContact;
