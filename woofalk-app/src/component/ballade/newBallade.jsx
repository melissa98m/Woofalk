import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    Card,
    Checkbox,
    Chip,
    Container,
    ListItemText,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { FieldLabel } from "../_partials/_ui/FieldLabel";
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { API_URL } from "../../config";

function NewBallade() {

    document.title = "Ajouter une balade";

    const navigate = useNavigate();

    const [ballade_name, setName] = useState("");
    const [ballade_description, setDescription] = useState("");
    const [ballade_image, setImage] = useState("");
    const [ballade_latitude, setLatitude] = useState("");
    const [ballade_longitude, setLongitude] = useState("");
    const [distance, setDistance] = useState("");
    const [denivele, setDenivele] = useState("");
    const [ballade_website, setWebsite] = useState("");
    const [tags, setTags] = useState([]);

    const [availableTags, setAvailableTags] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            ballade_name: "",
            ballade_description: "",
            ballade_longitude: "",
            ballade_latitude: "",
            distance: "",
            denivele: "",
            ballade_image: "",
            ballade_website: "",
        },
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/tags?scope=ballade`).then((res) => setAvailableTags(res.data.data));
    }, []);

    let reset = () => {
        setName("");
        setDescription("");
        setImage("");
        setTags([]);
        setLongitude("");
        setDenivele("");
        setLatitude("");
        setDistance("");
        setWebsite("");
    };

    let newBalladeForm = async () => {
        setSubmitting(true);
        try {
            let formData = new FormData();
            formData.append("ballade_name", ballade_name);
            formData.append("ballade_description", ballade_description);
            formData.append("ballade_latitude", ballade_latitude);
            formData.append("ballade_longitude", ballade_longitude);
            formData.append("denivele", denivele);
            formData.append("distance", distance ? String(distance).replace(",", ".") : "");
            formData.append("ballade_image", ballade_image);
            formData.append("ballade_website", ballade_website);
            tags.forEach((tagId) => formData.append("tags[]", tagId));

            let res = await axios.post(`${API_URL}/api/ballades`, formData);
            if (res.status === 200) {
                reset();
                setToastMessage({ message: "Balade ajoutée ! Vous pouvez en ajouter une autre", severity: "success" });
                setShowToast(true);
            } else {
                setToastMessage({ message: "Une erreur est survenue", severity: "error" });
                setShowToast(true);
            }
        } catch (err) {
            console.log(err);
            setToastMessage({ message: "Une erreur est survenue", severity: "error" });
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" id="new-ballade" sx={{ px: { xs: 2, md: 4 }, py: { xs: "24px", md: "32px" }, pb: "80px" }}>
            <Breadcrumbs aria-label="Fil d'ariane" sx={{ marginBottom: "16px", fontSize: "13px" }}>
                <Typography component={Link} to="/ballades" color="text.secondary" sx={{ textDecoration: "none", fontSize: "13px" }}>Balades</Typography>
                <Typography color="text.primary" sx={{ fontSize: "13px" }}>Ajouter une balade</Typography>
            </Breadcrumbs>

            <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Ajouter une balade</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: { xs: "24px", md: "32px" } }}>
                Partagez un itinéraire sympa à parcourir avec votre chien.
            </Typography>

            <Card sx={{ maxWidth: "640px", padding: { xs: "20px", md: "32px" } }}>
                <Box
                    component="form"
                    onSubmit={handleSubmit(newBalladeForm)}
                    noValidate
                    sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="ballade_name">Nom de la balade</FieldLabel>
                        <Controller
                            name="ballade_name"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("ballade_name", { required: "Ce champ est requis" })}
                                    id="ballade_name"
                                    onChange={(e) => setName(e.target.value)}
                                    hiddenLabel
                                    placeholder="Ex. Boucle du Bois de Vincennes"
                                    variant="outlined"
                                    value={ballade_name}
                                    error={!!errors.ballade_name}
                                    aria-required="true"
                                />
                            )}
                        />
                        {errors.ballade_name ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.ballade_name?.message}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="tags-select">Tags (optionnel)</FieldLabel>
                        <Select
                            id="tags-select"
                            labelId="tags-select-label"
                            multiple
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            variant="outlined"
                            displayEmpty
                            renderValue={(selected) => selected.length === 0 ? (
                                <Typography component="span" color="text.secondary">Aucun tag</Typography>
                            ) : (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {selected.map((id) => {
                                        const tagName = availableTags.find((t) => t.id === id)?.tag_name;
                                        return <Chip key={id} size="small" label={truncateLabel(tagName)} title={tagName} />;
                                    })}
                                </Box>
                            )}
                        >
                            {availableTags.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                    <Checkbox checked={tags.indexOf(t.id) > -1} />
                                    <ListItemText primary={t.tag_name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>

                    <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <FieldLabel htmlFor="ballade_latitude">Latitude</FieldLabel>
                            <Controller
                                name="ballade_latitude"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("ballade_latitude", { required: "Ce champ est requis" })}
                                        id="ballade_latitude"
                                        onChange={(e) => setLatitude(e.target.value)}
                                        hiddenLabel
                                        placeholder="Ex. 48.8319"
                                        inputMode="decimal"
                                        variant="outlined"
                                        value={ballade_latitude}
                                        error={!!errors.ballade_latitude}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.ballade_latitude ? (
                                <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.ballade_latitude?.message}</Alert>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <FieldLabel htmlFor="ballade_longitude">Longitude</FieldLabel>
                            <Controller
                                name="ballade_longitude"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("ballade_longitude", { required: "Ce champ est requis" })}
                                        id="ballade_longitude"
                                        onChange={(e) => setLongitude(e.target.value)}
                                        hiddenLabel
                                        placeholder="Ex. 2.4392"
                                        inputMode="decimal"
                                        variant="outlined"
                                        value={ballade_longitude}
                                        error={!!errors.ballade_longitude}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.ballade_longitude ? (
                                <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.ballade_longitude?.message}</Alert>
                            ) : null}
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <FieldLabel htmlFor="distance">Distance en km</FieldLabel>
                            <Controller
                                name="distance"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("distance", {
                                        required: "Ce champ est requis",
                                        pattern: { value: /^\d+([.,]\d+)?$/, message: "Distance invalide (ex. 8,4)" },
                                    })}
                                        id="distance"
                                        onChange={(e) => setDistance(e.target.value)}
                                        hiddenLabel
                                        placeholder="Ex. 8,4"
                                        inputMode="decimal"
                                        variant="outlined"
                                        value={distance}
                                        error={!!errors.distance}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.distance ? (
                                <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.distance?.message}</Alert>
                            ) : null}
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
                            <FieldLabel htmlFor="denivele">Dénivelé en m</FieldLabel>
                            <Controller
                                name="denivele"
                                control={control}
                                render={() => (
                                    <TextField
                                        {...register("denivele", { required: "Ce champ est requis" })}
                                        id="denivele"
                                        type="number"
                                        onChange={(e) => setDenivele(e.target.value)}
                                        hiddenLabel
                                        placeholder="Ex. 130"
                                        variant="outlined"
                                        value={denivele}
                                        error={!!errors.denivele}
                                        aria-required="true"
                                    />
                                )}
                            />
                            {errors.denivele ? (
                                <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.denivele?.message}</Alert>
                            ) : null}
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="ballade_description">Description</FieldLabel>
                        <Controller
                            name="ballade_description"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("ballade_description", {
                                        required: "Ce champ est requis",
                                    })}
                                    id="ballade_description"
                                    multiline
                                    rows={4}
                                    onChange={(e) => setDescription(e.target.value)}
                                    hiddenLabel
                                    placeholder="Chemins stabilisés, point d'eau, fréquentation…"
                                    variant="outlined"
                                    value={ballade_description}
                                    error={!!errors.ballade_description}
                                    aria-required="true"
                                />
                            )}
                        />
                        {errors.ballade_description ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.ballade_description?.message}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="ballade_website">Site web (optionnel)</FieldLabel>
                        <Controller
                            name="ballade_website"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("ballade_website", {
                                        pattern: { value: /^https?:\/\/.+/i, message: "L'URL doit commencer par http:// ou https://" },
                                    })}
                                    id="ballade_website"
                                    type="url"
                                    onChange={(e) => setWebsite(e.target.value)}
                                    hiddenLabel
                                    placeholder="https://exemple.fr"
                                    variant="outlined"
                                    value={ballade_website}
                                    error={!!errors.ballade_website}
                                />
                            )}
                        />
                        {errors.ballade_website ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.ballade_website?.message}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="ballade_image">Photo de la balade</FieldLabel>
                        <Button component="label" variant="outlined" color="secondary" sx={{ alignSelf: "flex-start" }}>
                            {ballade_image ? "Changer la photo" : "Choisir une photo"}
                            <input
                                {...register("ballade_image")}
                                id="ballade_image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files[0])}
                                style={{
                                    clip: "rect(0 0 0 0)", clipPath: "inset(50%)", height: 1, width: 1,
                                    overflow: "hidden", position: "absolute", whiteSpace: "nowrap",
                                }}
                            />
                        </Button>
                        {ballade_image ? (
                            <Typography variant="body2" color="text.secondary">{ballade_image.name}</Typography>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                        <Button type="submit" variant="contained" disabled={submitting}>
                            {submitting ? "Envoi…" : "Publier la balade"}
                        </Button>
                        <Button variant="text" color="secondary" onClick={() => navigate("/ballades")}>
                            Retour à la liste
                        </Button>
                    </Box>
                </Box>
            </Card>

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

export default NewBallade;
