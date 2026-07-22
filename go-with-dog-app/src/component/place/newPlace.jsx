import {
    Box,
    Button,
    FormControl,
    Snackbar,
    TextField,
    Alert,
    Input,
    Grid,
    Select, MenuItem, InputLabel
} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { API_URL } from "../../config";
import { AddressSearchField } from "../address/AddressSearchField";


function NewPlace(props) {

    const [id, setID] = useState("");
    const [place_name, setName] = useState("");
    const [place_description, setDescription] = useState("");
    const [place_image, setImage] = useState("");
    // One of ...
    const [category, setCategory] = useState(undefined);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressError, setAddressError] = useState("");

    // List All
    const [categories, setCategories] = useState({});
    // Addresses already in the DB, kept only to avoid creating duplicate
    // rows for a spot that's already been used by another place.
    const [addresses, setAddresses] = useState({});

    const [newPlace, setShowNew] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Handle Toast place
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {
            place_name: '',
            place_description: '',
            place_image: '',
            category: {}
    }});



    useEffect( () => {
        getAlls();
    }, [])

    let reset = () => {
        setName('');
        setDescription('');
        setImage('');
        setCategory({});
        setSelectedAddress(null);
    }

    let getAlls = async () => {
        await axios.get(`${API_URL}/api/categories` ).then((actualData) => { setCategories(actualData.data.data) });
        await axios.get(`${API_URL}/api/addresses`).then((actualData) => { setAddresses(actualData.data.data)});
    }

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
            latitude: selectedAddress.latitude, longitude: selectedAddress.longitude
        }, {
            "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
        });
        let created = res.data.data;
        setAddresses(update(Array.isArray(addresses) ? addresses : [], {$push: [created]}));
        return created.id;
    }

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

            let res = await axios.post(`${API_URL}/api/places`, formData, {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            });
            if (res.status === 200) {
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.newValue.data, {$push: [{id : tab.id, place_name: tab.place_name, place_description: tab.place_description, place_image: tab.place_image, category: tab.category, address: tab.address}]})
                props.handleDataChange(data);
                reset();
                setToastMessage({message: "Lieu ajouté ! Vous pouvez en ajouter un autre", severity: "success"});
                setShowToast(true);
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
                setShowToast(true);
            }
        } catch (err) {
            console.log(err);
            setToastMessage({message: "Une erreur est survenue", severity: "error"});
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    }
    return (<Box>
        <Button variant="contained" onClick={() => {
            setShowNew(true)
        }}>Ajouter un lieu</Button>
        <CrudModal open={newPlace} onClose={() => setShowNew(false)} title="Nouveau lieu" titleId="new-place-title">
                <form onSubmit={handleSubmit(newPlaceForm)}>
                    <Grid container spacing={8}>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="place_name"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <TextField
                                   {...register(
                                       'place_name',
                                       {
                                           required: 'Ce champ est requis'
                                       }
                                   )}
                                   onChange={(e) => setName(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Nom"
                                   variant="standard"
                                   value={place_name}
                                />
                              )}
                            />
                            {errors.place_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.place_name?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="place_description"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <TextField
                                   {...register(
                                       'place_description',
                                       {
                                           required: 'Ce champ est requis',
                                           maxLength: {value: 255, message: 'Longueur maximale de 255 caractères'}
                                       }
                                   )}
                                   multiline
                                   rows={4}
                                   onChange={(e) => setDescription(e.target.value)}
                                   sx={{mt: 5, mb: 20, height: 50, width: '100%'}}
                                   label="Description"
                                   variant="outlined"
                                   value={place_description}
                                />
                              )}
                            />
                            <Box className='description-limit'>{place_description.length}/255 caractères</Box>
                            {errors.place_description ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.place_description?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="place_image"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <Input
                                   type='file'
                                   {...register('place_image')}
                                   onChange={(e) => setImage(e.target.files[0]) }
                                   sx={{mt: 5, height: 50}}
                                />
                              )}
                            />
                            {errors.place_image ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.place_image?.message}</Alert>
                            ) : ''}
                        </Grid>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="category"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                      <InputLabel id="category-select">Category</InputLabel>
                                      <Select
                                        labelId="category-select"
                                        id="category-select"
                                        value={category}
                                        label="Categorie de lieu"
                                        onChange={(e) => setCategory(e.target.value)}
                                        sx={{height: 50}}
                                        variant="outlined"
                                      >
                                      {categories.map((category) => {
                                          return(
                                              <MenuItem key={category.id} value={category.id}>{category.category_name}</MenuItem>
                                          )
                                      })}
                                      </Select>
                                  </FormControl>
                              )}
                            />
                            <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                <AddressSearchField
                                  value={selectedAddress}
                                  onSelect={(value) => { setSelectedAddress(value); setAddressError(""); }}
                                  label="Adresse"
                                  variant="outlined"
                                  sx={{height: 50}}
                                />
                            </FormControl>
                            {addressError ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{addressError}</Alert>
                            ) : ''}
                        </Grid>
                        <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                            <Button type="submit" sx={{m: 3}} variant="contained" disabled={submitting}>{submitting ? "Envoi..." : "Envoyer"}</Button>
                        </Grid>
                    </Grid>
                </form>
        </CrudModal>

        <Snackbar
            open={toast}
            autoHideDuration={3000}
            onClose={() => setShowToast(false)}
            anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        >
            <Alert onClose={() => setShowToast(false)} severity={toastMessage.severity} sx={{width: '100%'}}>
                {toastMessage.message}
            </Alert>
        </Snackbar>
    </Box>

    )
}

export default NewPlace;