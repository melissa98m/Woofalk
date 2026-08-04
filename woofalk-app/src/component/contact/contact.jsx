import {
    Alert,
    Box,
    Button,
    Card,
    Container,
    Link,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { FieldLabel } from "../_partials/_ui/FieldLabel";
import { Seo } from "../_partials/_seo/Seo";
import { API_URL } from "../../config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECT_OPTIONS = ["Signaler un lieu", "Proposer une balade", "Question générale", "Autre"];

function Contact() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [contenu, setContenu] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: { name: "", email: "", subject: "", contenu: "", website: "" },
    });

    const reset = () => {
        setName("");
        setEmail("");
        setSubject("");
        setContenu("");
    };

    const submitContact = async (formValues) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("email", email);
            formData.append("subject", subject);
            formData.append("contenu", contenu);
            // Honeypot: left empty by real users, filled in blindly by bots.
            // The API silently no-ops when this is non-empty.
            formData.append("website", formValues.website);

            const res = await axios.post(`${API_URL}/api/contact`, formData);
            if (res.status === 200) {
                reset();
                setToastMessage({ message: "Message envoyé, merci ! Nous vous répondrons rapidement.", severity: "success" });
                setShowToast(true);
            } else {
                setToastMessage({ message: "Une erreur est survenue, réessayez plus tard.", severity: "error" });
                setShowToast(true);
            }
        } catch (err) {
            setToastMessage({ message: "Une erreur est survenue, réessayez plus tard.", severity: "error" });
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" id="contact" sx={{ px: { xs: 2, md: 4 }, pt: { xs: "32px", md: "48px" }, pb: "80px" }}>
            <Seo
                title="Contact"
                description="Une question, une idée ou un lieu à signaler ? Contactez l'équipe Woofalk, réponse sous 48h."
            />
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" },
                    gap: { xs: "32px", md: "48px" },
                }}
            >
                <Box>
                    <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>
                        Une question, une idée ?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, marginBottom: "24px" }}>
                        Écrivez-nous pour signaler un lieu, proposer une balade ou simplement dire bonjour. On répond sous 48h.
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <Typography variant="body2" color="text.primary">
                            <strong>Email :</strong>{" "}
                            <Link href="mailto:bonjour@woofalk.com">bonjour@woofalk.com</Link>
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                            <strong>Réseaux :</strong> Instagram · Facebook
                        </Typography>
                    </Box>
                </Box>

                <Card sx={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px", height: "fit-content" }}>
                    <Box
                        component="form"
                        onSubmit={handleSubmit(submitContact)}
                        noValidate
                        sx={{ display: "flex", flexDirection: "column", gap: "16px" }}
                    >
                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <FieldLabel htmlFor="contact_name">Nom</FieldLabel>
                            <Controller
                                name="name"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("name", { required: "Ce champ est requis" })}
                                        aria-invalid={!!errors.name}
                                        aria-describedby={errors.name ? "name-error" : undefined}
                                        id="contact_name"
                                        onChange={(e) => setName(e.target.value)}
                                        hiddenLabel
                                        placeholder="Votre nom"
                                        variant="outlined"
                                        value={name}
                                        error={!!errors.name}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.name ? (
                                <Alert id="name-error" sx={{ p: 0, pl: 2 }} severity="error">{errors.name?.message}</Alert>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <FieldLabel htmlFor="contact_email">Email</FieldLabel>
                            <Controller
                                name="email"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("email", {
                                            required: "Ce champ est requis",
                                            pattern: { value: EMAIL_PATTERN, message: "Adresse email invalide" },
                                        })}
                                        aria-invalid={!!errors.email}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                        id="contact_email"
                                        type="email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        hiddenLabel
                                        placeholder="vous@exemple.fr"
                                        variant="outlined"
                                        value={email}
                                        error={!!errors.email}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.email ? (
                                <Alert id="email-error" sx={{ p: 0, pl: 2 }} severity="error">{errors.email?.message}</Alert>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <FieldLabel htmlFor="contact_subject">Sujet</FieldLabel>
                            <Controller
                                name="subject"
                                control={control}
                                rules={{ required: "Ce champ est requis" }}
                                render={({ field }) => (
                                    <Select
                                        id="contact_subject"
                                        labelId="contact_subject-label"
                                        value={subject}
                                        onChange={(e) => { setSubject(e.target.value); field.onChange(e.target.value); }}
                                        onBlur={field.onBlur}
                                        variant="outlined"
                                        displayEmpty
                                        error={!!errors.subject}
                                    >
                                        <MenuItem value="" disabled>Choisissez un sujet</MenuItem>
                                        {SUBJECT_OPTIONS.map((option) => (
                                            <MenuItem key={option} value={option}>{option}</MenuItem>
                                        ))}
                                    </Select>
                                )}
                            />
                            {errors.subject ? (
                                <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.subject?.message}</Alert>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <FieldLabel htmlFor="contact_message">Message</FieldLabel>
                            <Controller
                                name="contenu"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("contenu", { required: "Ce champ est requis" })}
                                        aria-invalid={!!errors.contenu}
                                        aria-describedby={errors.contenu ? "contenu-error" : undefined}
                                        id="contact_message"
                                        multiline
                                        rows={5}
                                        onChange={(e) => setContenu(e.target.value)}
                                        hiddenLabel
                                        placeholder="Votre message…"
                                        variant="outlined"
                                        value={contenu}
                                        error={!!errors.contenu}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.contenu ? (
                                <Alert id="contenu-error" sx={{ p: 0, pl: 2 }} severity="error">{errors.contenu?.message}</Alert>
                            ) : null}
                        </Box>

                        {/* Honeypot: real users never see this field (off-screen, out of
                            tab order, aria-hidden); bots that fill every input trip it and
                            the API silently no-ops instead of erroring, so they don't adapt. */}
                        <Box
                            aria-hidden="true"
                            sx={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
                        >
                            <label htmlFor="contact_website">Site web</label>
                            <input
                                {...register("website")}
                                id="contact_website"
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </Box>

                        <Button type="submit" variant="contained" disabled={submitting} sx={{ alignSelf: "flex-start" }}>
                            {submitting ? "Envoi…" : "Envoyer le message"}
                        </Button>

                        <Typography variant="caption" color="text.secondary">
                            Vos données sont utilisées uniquement pour répondre à votre message. En savoir plus dans notre{" "}
                            <Link component={RouterLink} to="/politique-confidentialite">politique de confidentialité</Link>.
                        </Typography>
                    </Box>
                </Card>
            </Box>

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
        </Container>
    );
}

export default Contact;
