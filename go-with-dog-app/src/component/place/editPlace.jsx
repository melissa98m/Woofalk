import {
    Box,
    Button,
    Checkbox,
    Chip,
    FormControl,
    ListItemText,
    Snackbar,
    TextField,
    Alert,
    Grid,
    MenuItem,
    Select, InputLabel, Input
} from "@mui/material";
import {Edit} from "@mui/icons-material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function EditPlace(props) {
    const [id, setID] = useState("");
    const [place_name, setName] = useState(props.updateValue.place_name);
    const [place_description, setDescription] = useState(props.updateValue.place_description);
    const [place_image, setImage] = useState('');
    const [cImage, setCImage] = useState(props.updateValue.place_image);
    const [status, setStatus] = useState(props.updateValue.status || 'publie');

    // One of ...
    const [category, setCategory] = useState(undefined);
    const [address, setAddress] = useState(undefined);
    const [tags, setTags] = useState((props.updateValue.tags ?? []).map((t) => t.id));
    // List All
    const [categories, setCategories] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    const [onePlace, setOnePlace] = useState("");
    const [editPlace, setShowEdit] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({ defaultValues: {
        place_name: props.updateValue.place_name,
        place_description: props.updateValue.place_description,
        place_image: props.updateValue.place_image,
        category: props.updateValue.category,
        address: props.updateValue.address,
    } });

    useEffect( () => {
        getAlls()
    }, [])

    let getAlls = async () => {
        await axios.get(`${API_URL}/api/categories`).then((actualData) => { setCategories(actualData.data.data) });
        await axios.get(`${API_URL}/api/addresses`).then((actualData) => { setAddresses(actualData.data.data) });
        await axios.get(`${API_URL}/api/tags?scope=place`).then((actualData) => { setAvailableTags(actualData.data.data) });
    }

    let editPlaceForm = async () => {
        try {

            let formData = new FormData();
            formData.append("place_name",  place_name);
            formData.append("place_description", place_description);
            formData.append("category",  category ? `${category}` : `${props.updateValue.category.id}`);
            formData.append("address", address ? `${address}` : `${props.updateValue.address.id}`);
            formData.append("status", status);
            tags.forEach((tagId) => formData.append("tags[]", tagId));
            if (place_image){
                formData.append("place_image", place_image);
            }
            formData.append("_method", 'PATCH');

            let updatedPlace = {
                id: id ? id : parseInt(onePlace.id),
                place_name: place_name ? place_name : onePlace.place_name,
                place_description: place_description ? place_description : onePlace.place_description,
                place_image: place_image ? place_image : onePlace.place_image,
                category: category ? category : onePlace.category.id,
                address: address ? address : onePlace.address.id,
                status: status,
            }

            let res = await axios.post(`${API_URL}/api/places/` + onePlace.id, formData, {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            })
            if (res.status === 200) {
                const foundIndex = props.updateValue.data.findIndex(x => x.id === onePlace.id);
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.updateValue.data, {[foundIndex]: {$set: tab}})
                props.handleDataChange(data, 'edit');
                setShowEdit(false)
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
                setShowToast(true)
            }

        } catch (err) {
            console.log(err);
        }
    }

    return(<Box >
          <RowActionButton
            icon={<Edit fontSize="small"/>}
            onClick={() => {
                setShowEdit(true)
                setOnePlace({
                    id: props.updateValue.id,
                    place_name: props.updateValue.place_name,
                    place_description: props.updateValue.place_description,
                    place_image: props.updateValue.place_image,
                    category: props.updateValue.category,
                    address: props.updateValue.address
                })
                setCImage(props.updateValue.place_image);
            }}>
              Modifier
          </RowActionButton>
         <CrudModal open={editPlace} onClose={() => setShowEdit(false)} title="Editer un lieu" titleId="edit-place-title">
                <form onSubmit={handleSubmit(editPlaceForm)}>
                    <Grid container spacing={8}>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="place_name"
                              control={control}
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
                                   defaultValue={place_name}
                                />
                              )}
                            />
                            {errors.place_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.place_name?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="place_description"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'place_description',
                                       {
                                           required: 'Ce champ est requis'
                                       }
                                   )}
                                   multiline
                                   rows={4}
                                   onChange={(e) => setDescription(e.target.value)}
                                   sx={{mt: 5, mb: 20, height: 50, width: '100%'}}
                                   label="Description"
                                   variant="outlined"
                                   defaultValue={place_description}
                                />
                              )}
                            />
                            {errors.place_description ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.place_description?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="place_image"
                              control={control}
                              render={() => (
                                  <Box sx={{ display: 'flex'}}>
                                      <Box component="img" src={`${API_URL}/storage/uploads/places/${cImage}`} alt={cImage} sx={{ width: "80px", mr: 3 }}/>
                                      <Input
                                       type='file'
                                       {...register('place_image')}
                                       onChange={(e) => setImage(e.target.files[0])}
                                       sx={{mt: 5, height: 50}}
                                      />
                                  </Box>
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
                              render={() => (
                                  <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                      <InputLabel id="category-select">Category</InputLabel>
                                      <Select
                                        labelId="category-select"
                                        id="category-select"
                                        defaultValue={props.updateValue.category.id}
                                        label="Category"
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
                            <Controller
                              name="addresse"
                              control={control}
                              render={() => (
                                  <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                      <InputLabel id="address-select">Adresse</InputLabel>
                                      <Select
                                        labelId="address-select"
                                        id="address-select"
                                        defaultValue={props.updateValue.address.id}
                                        label="Adresse"
                                        onChange={(e) => setAddress(e.target.value)}
                                        sx={{height: 50}}
                                        variant="outlined"
                                      >
                                      {addresses.map((address) => {
                                          return(
                                              <MenuItem key={address.id} value={address.id}>{address.address} {address.postal_code} {address.city}</MenuItem>
                                          )
                                      })}
                                      </Select>
                                  </FormControl>
                              )}
                            />

                            <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                <InputLabel id="tags-select">Tags</InputLabel>
                                <Select
                                    labelId="tags-select"
                                    id="tags-select"
                                    multiple
                                    value={tags}
                                    label="Tags"
                                    onChange={(e) => setTags(e.target.value)}
                                    sx={{height: 50}}
                                    variant="outlined"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
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
                            </FormControl>

                            <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                <InputLabel id="status-select">Statut</InputLabel>
                                <Select
                                    labelId="status-select"
                                    id="status-select"
                                    defaultValue={status}
                                    label="Statut"
                                    onChange={(e) => setStatus(e.target.value)}
                                    sx={{height: 50}}
                                    variant="outlined"
                                >
                                    <MenuItem value="publie">Publié</MenuItem>
                                    <MenuItem value="en_attente">En attente</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                            <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
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
export default EditPlace;