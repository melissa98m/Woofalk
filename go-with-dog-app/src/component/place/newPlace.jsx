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
import update from "immutability-helper";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { FieldLabel } from "../_partials/_ui/FieldLabel";
import { AddressSearchField } from "../address/AddressSearchField";
import { API_URL } from "../../config";

function NewPlace() {

    document.title = "Ajouter un lieu";

    const navigate = useNavigate();

    const [place_name, setName] = useState("");
    const [place_description, setDescription] = useState("");
    const [place_image, setImage] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressError, setAddressError] = useState("");

    const [categories, setCategories] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    // Addresses already in the DB, kept only to avoid creating duplicate
    // rows for a spot that's already been used by another place.
    const [addresses, setAddresses] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            place_name: "",
            place_description: "",
            place_image: "",
            category: "",
        },
    });

    useEffect(() => {
        axios.get(`${API_URL}/api/categories`).then((res) => setCategories(res.data.data));
        axios.get(`${API_URL}/api/addresses`).then((res) => setAddresses(res.data.data));
        axios.get(`${API_URL}/api/tags?scope=place`).then((res) => setAvailableTags(res.data.data));
    }, []);

    let reset = () => {
        setName("");
        setDescription("");
        setImage("");
        setCategory("");
        setTags([]);
        setSelectedAddress(null);
    };

    // Reuses an existing address row for the same spot if there is one,
    // otherwise creates it — the place form never shows a separate step.
    let resolveAddressId = async () => {
        let existing = (Array.isArray(addresses) ? addresses : []).find((a) =>
            a.postal_code === selectedAddress.postal_code &&
            a.address.trim().toLowerCase() === selectedAddress.address.trim().toLowerCase()
        );
        if (existing) {
            return existing.id;
        }

        let res = await axios.post(`${API_URL}/api/addresses`, {
            address: selectedAddress.address, city: selectedAddress.city, postal_code: selectedAddress.postal_code,
            latitude: selectedAddress.latitude, longitude: selectedAddress.longitude,
        }, {
            headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
        });
        let created = res.data.data;
        setAddresses(update(Array.isArray(addresses) ? addresses : [], { $push: [created] }));
        return created.id;
    };

    let newPlaceForm = async () => {
        if (!selectedAddress) {
            setAddressError("Choisissez une adresse dans la liste");
            return;
        }
        setAddressError("");
        setSubmitting(true);
        try {
            let addressId = await resolveAddressId();

            let formData = new FormData();
            formData.append("place_name", place_name);
            formData.append("place_description", place_description);
            formData.append("place_image", place_image);
            formData.append("category", `${category}`);
            formData.append("address", `${addressId}`);
            tags.forEach((tagId) => formData.append("tags[]", tagId));

            let res = await axios.post(`${API_URL}/api/places`, formData, {
                headers: { Authorization: "Bearer" + localStorage.getItem("access_token") },
            });
            if (res.status === 200) {
                reset();
                setToastMessage({ message: "Lieu ajouté ! Vous pouvez en ajouter un autre", severity: "success" });
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
        <Container maxWidth="md" id="new-place" sx={{ px: { xs: 2, md: 4 }, py: { xs: "24px", md: "32px" }, pb: "80px" }}>
            <Breadcrumbs aria-label="Fil d'ariane" sx={{ marginBottom: "16px", fontSize: "13px" }}>
                <Typography component={Link} to="/places" color="text.secondary" sx={{ textDecoration: "none", fontSize: "13px" }}>Lieux</Typography>
                <Typography color="text.primary" sx={{ fontSize: "13px" }}>Ajouter un lieu</Typography>
            </Breadcrumbs>

            <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>Ajouter un lieu</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: { xs: "24px", md: "32px" } }}>
                Partagez un endroit sympa pour sortir avec votre chien.
            </Typography>

            <Card sx={{ maxWidth: "640px", padding: { xs: "20px", md: "32px" } }}>
                <Box
                    component="form"
                    onSubmit={handleSubmit(newPlaceForm)}
                    noValidate
                    sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="place_name">Nom du lieu</FieldLabel>
                        <Controller
                            name="place_name"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("place_name", { required: "Ce champ est requis" })}
                                    id="place_name"
                                    onChange={(e) => setName(e.target.value)}
                                    hiddenLabel
                                    placeholder="Ex. Forêt de Fontainebleau"
                                    variant="outlined"
                                    value={place_name}
                                    error={!!errors.place_name}
                                    aria-required="true"
                                />
                            )}
                        />
                        {errors.place_name ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.place_name?.message}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="category-select">Catégorie</FieldLabel>
                        <Controller
                            name="category"
                            control={control}
                            rules={{ required: "Ce champ est requis" }}
                            render={({ field }) => (
                                <Select
                                    id="category-select"
                                    labelId="category-select-label"
                                    value={category}
                                    onChange={(e) => { setCategory(e.target.value); field.onChange(e.target.value); }}
                                    onBlur={field.onBlur}
                                    variant="outlined"
                                    displayEmpty
                                    error={!!errors.category}
                                >
                                    <MenuItem value="" disabled>Choisissez une catégorie</MenuItem>
                                    {categories.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.category_name}</MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                        {errors.category ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.category?.message}</Alert>
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
                                    {selected.map((id) => (
                                        <Chip key={id} size="small" label={availableTags.find((t) => t.id === id)?.tag_name} />
                                    ))}
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

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <AddressSearchField
                            value={selectedAddress}
                            onSelect={(value) => { setSelectedAddress(value); setAddressError(""); }}
                            label="Adresse"
                            variant="outlined"
                        />
                        {addressError ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{addressError}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="place_description">Description</FieldLabel>
                        <Controller
                            name="place_description"
                            control={control}
                            render={() => (
                                <TextField
                                    {...register("place_description", {
                                        required: "Ce champ est requis",
                                        maxLength: { value: 255, message: "Longueur maximale de 255 caractères" },
                                    })}
                                    id="place_description"
                                    multiline
                                    rows={4}
                                    onChange={(e) => setDescription(e.target.value)}
                                    hiddenLabel
                                    placeholder="Chemins stabilisés, point d'eau, accès en laisse…"
                                    variant="outlined"
                                    value={place_description}
                                    error={!!errors.place_description}
                                    aria-required="true"
                                    aria-describedby="place-description-count"
                                />
                            )}
                        />
                        <Typography id="place-description-count" variant="body2" color="text.secondary">{place_description.length}/255 caractères</Typography>
                        {errors.place_description ? (
                            <Alert sx={{ p: 0, pl: 2 }} severity="error">{errors.place_description?.message}</Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <FieldLabel htmlFor="place_image">Photo du lieu</FieldLabel>
                        <Button component="label" variant="outlined" color="secondary" sx={{ alignSelf: "flex-start" }}>
                            {place_image ? "Changer la photo" : "Choisir une photo"}
                            <input
                                {...register("place_image")}
                                id="place_image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImage(e.target.files[0])}
                                style={{
                                    clip: "rect(0 0 0 0)", clipPath: "inset(50%)", height: 1, width: 1,
                                    overflow: "hidden", position: "absolute", whiteSpace: "nowrap",
                                }}
                            />
                        </Button>
                        {place_image ? (
                            <Typography variant="body2" color="text.secondary">{place_image.name}</Typography>
                        ) : null}
                    </Box>

                    <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                        <Button type="submit" variant="contained" disabled={submitting}>
                            {submitting ? "Envoi…" : "Publier le lieu"}
                        </Button>
                        <Button variant="text" color="secondary" onClick={() => navigate("/places")}>
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

export default NewPlace;
