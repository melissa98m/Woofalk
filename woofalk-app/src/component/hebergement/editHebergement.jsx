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
import { truncateLabel } from "../_partials/_ui/truncateLabel";
import { API_URL } from "../../config";

function EditHebergement(props) {
    const [id, setID] = useState("");
    const [hebergement_name, setName] = useState(props.updateValue.hebergement_name);
    const [hebergement_description, setDescription] = useState(props.updateValue.hebergement_description);
    const [hebergement_image, setImage] = useState('');
    const [cImage, setCImage] = useState(props.updateValue.hebergement_image);
    const [hebergement_website, setWebsite] = useState(props.updateValue.hebergement_website || '');
    const [price_indication, setPriceIndication] = useState(props.updateValue.price_indication || '');
    const [status, setStatus] = useState(props.updateValue.status || 'publie');

    // One of ...
    const [category, setCategory] = useState(undefined);
    const [address, setAddress] = useState(undefined);
    const [tags, setTags] = useState((props.updateValue.tags ?? []).map((t) => t.id));
    // List All
    const [categories, setCategories] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    const [oneHebergement, setOneHebergement] = useState("");
    const [editHebergement, setShowEdit] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({ defaultValues: {
        hebergement_name: props.updateValue.hebergement_name,
        hebergement_description: props.updateValue.hebergement_description,
        hebergement_image: props.updateValue.hebergement_image,
        hebergement_website: props.updateValue.hebergement_website,
        price_indication: props.updateValue.price_indication,
        category: props.updateValue.category,
        address: props.updateValue.address,
    } });

    useEffect( () => {
        getAlls()
    }, [])

    let getAlls = async () => {
        await axios.get(`${API_URL}/api/categories?scope=hebergement`).then((actualData) => { setCategories(actualData.data.data) });
        await axios.get(`${API_URL}/api/addresses`).then((actualData) => { setAddresses(actualData.data.data) });
        await axios.get(`${API_URL}/api/tags?scope=hebergement`).then((actualData) => { setAvailableTags(actualData.data.data) });
    }

    let editHebergementForm = async () => {
        try {

            let formData = new FormData();
            formData.append("hebergement_name",  hebergement_name);
            formData.append("hebergement_description", hebergement_description);
            formData.append("hebergement_website", hebergement_website);
            formData.append("price_indication", price_indication);
            formData.append("category",  category ? `${category}` : `${props.updateValue.category.id}`);
            formData.append("address", address ? `${address}` : `${props.updateValue.address.id}`);
            formData.append("status", status);
            tags.forEach((tagId) => formData.append("tags[]", tagId));
            if (hebergement_image){
                formData.append("hebergement_image", hebergement_image);
            }
            formData.append("_method", 'PATCH');

            let res = await axios.post(`${API_URL}/api/hebergements/` + oneHebergement.id, formData)
            if (res.status === 200) {
                const foundIndex = props.updateValue.data.findIndex(x => x.id === oneHebergement.id);
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
                setOneHebergement({
                    id: props.updateValue.id,
                    hebergement_name: props.updateValue.hebergement_name,
                    hebergement_description: props.updateValue.hebergement_description,
                    hebergement_image: props.updateValue.hebergement_image,
                    hebergement_website: props.updateValue.hebergement_website,
                    price_indication: props.updateValue.price_indication,
                    category: props.updateValue.category,
                    address: props.updateValue.address
                })
                setCImage(props.updateValue.hebergement_image);
                setWebsite(props.updateValue.hebergement_website || '');
                setPriceIndication(props.updateValue.price_indication || '');
            }}>
              Modifier
          </RowActionButton>
         <CrudModal open={editHebergement} onClose={() => setShowEdit(false)} title="Editer un hébergement" titleId="edit-hebergement-title">
                <form onSubmit={handleSubmit(editHebergementForm)}>
                    <Grid container spacing={8}>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="hebergement_name"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'hebergement_name',
                                       {
                                           required: 'Ce champ est requis'
                                       }
                                   )}
                                   onChange={(e) => setName(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Nom"
                                   variant="standard"
                                   defaultValue={hebergement_name}
                                />
                              )}
                            />
                            {errors.hebergement_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.hebergement_name?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="hebergement_website"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'hebergement_website',
                                       {
                                           pattern: {value: /^https?:\/\/.+/i, message: "L'URL doit commencer par http:// ou https://"}
                                       }
                                   )}
                                   type="url"
                                   onChange={(e) => setWebsite(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Site web (optionnel)"
                                   variant="standard"
                                   defaultValue={hebergement_website}
                                />
                              )}
                            />
                            {errors.hebergement_website ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.hebergement_website?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="price_indication"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register('price_indication')}
                                   onChange={(e) => setPriceIndication(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Tarif chien (optionnel)"
                                   variant="standard"
                                   defaultValue={price_indication}
                                />
                              )}
                            />

                            <Controller
                              name="hebergement_description"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'hebergement_description',
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
                                   defaultValue={hebergement_description}
                                />
                              )}
                            />
                            {errors.hebergement_description ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.hebergement_description?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="hebergement_image"
                              control={control}
                              render={() => (
                                  <Box sx={{ display: 'flex'}}>
                                      <Box component="img" src={`${API_URL}/storage/uploads/hebergements/${cImage}`} alt={cImage} sx={{ width: "80px", mr: 3 }}/>
                                      <Input
                                       type='file'
                                       {...register('hebergement_image')}
                                       onChange={(e) => setImage(e.target.files[0])}
                                       sx={{mt: 5, height: 50}}
                                      />
                                  </Box>
                              )}
                            />
                            {errors.hebergement_image ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.hebergement_image?.message}</Alert>
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
export default EditHebergement;
