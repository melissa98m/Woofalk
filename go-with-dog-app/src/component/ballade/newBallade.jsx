import {
    Box,
    Button,
    FormControl,
    Modal,
    Snackbar,
    TextField,
    Typography,
    Alert,
    Input,
    Grid,
    Select, MenuItem, InputLabel
} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from "../../config";


function NewBallade(props) {

     const [id, setID] = useState("");
        const [ballade_name, setName] = useState("");
        const [ballade_description, setDescription] = useState("");
        const [ballade_image, setImage] = useState('');
        const [ballade_latitude, setLatitude] = useState("");
        const [ballade_longitude , setLongitude] = useState("");
        const [distance , setDistance] = useState("");
        const [ denivele , setDenivele] = useState("");

        // One of ...
        const [tag, setTag] = useState(undefined);

        // List All
        const [tags, setTags] = useState({});

    const [newBallade , setShowNew] = useState(false);

    // Handle Toast place
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {
            ballade_name: '',
                    ballade_description: '',
                    ballade_longitude : '',
                    ballade_latitude: '',
                    distance: '',
                    denivele: '',
                    ballade_image: '',
                    tag: {},
    }});

    useEffect( () => {
        getAlls();
    }, [])

    let reset = () => {
        setName('');
        setDescription('');
        setImage('');
        setTag({});
        setLongitude('');
        setDenivele('');
        setLatitude('');
        setDistance('');
    }

    let getAlls = async () => {
        await axios.get(`${API_URL}/api/tags` ).then((actualData) => { setTags(actualData.data.data) });
    }

    let newBalladeForm = async () => {
        try {

            let formData = new FormData();

            formData.append("ballade_name",  ballade_name);
            formData.append("ballade_description", ballade_description);
            formData.append("ballade_latitude", ballade_latitude);
            formData.append("ballade_longitude", ballade_longitude);
            formData.append("denivele", denivele);
            formData.append("distance", distance);
            formData.append("ballade_image", ballade_image);
            formData.append("tag", `${tag}`);

            let newBallade = {
                ballade_name: ballade_name,
                ballade_description: ballade_description,
                ballade_latitude : ballade_latitude,
                ballade_longitude : ballade_longitude,
                distance : distance ,
                denivele : denivele ,
                ballade_image: ballade_image,
                tag: tag,

            };

            let res = await axios.post(`${API_URL}/api/ballades`, formData, {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            });
            if (res.status === 200) {
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.newValue.data, {$push: [{id : tab.id, ballade_name: tab.ballade_name,
                 ballade_description: tab.ballade_description,ballade_latitude: tab.ballade_latitude ,
                 ballade_longitude: tab.ballade_longitude ,distance : tab.distance , denivele : tab.denivele , ballade_image: tab.ballade_image, tag: tab.tag}]})
                props.handleDataChange(data);
                reset();
                setToastMessage({message: "Balade ajoutée ! Vous pouvez en ajouter une autre", severity: "success"});
                setShowToast(true);
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
            }
        } catch (err) {
            console.log(err);
        }
    }
    return (<Box>
        <Button variant="contained" onClick={() => {
            setShowNew(true)
        }}>Ajouter</Button>
        <Modal
            id="modal-crud-container"
            hideBackdrop
            open={newBallade}
            onClose={() => setShowNew(false)}
            aria-labelledby="new-ballade-title"
            aria-describedby="child-modal-description"
        >
            <Box className="modal-crud modal-crud-ballade" sx={{bgcolor: 'background.default'}}>
               <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                           <Button variant="outlined"  color="secondary" onClick={() => setShowNew(false)}><CloseIcon /></Button>
                            </Grid>
                <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="new-ballade-title">Nouvelle balade</Typography>
                <form onSubmit={handleSubmit(newBalladeForm)}>
                    <Grid container spacing={8}>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="ballade_name"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <TextField
                                   {...register(
                                       'ballade_name',
                                       {
                                           required: 'Ce champ est requis'
                                       }
                                   )}
                                   onChange={(e) => setName(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Nom"
                                   variant="standard"
                                   value={ballade_name}
                                />
                              )}
                            />
                            {errors.ballade_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_name?.message}</Alert>
                            ) : ''}
                             <Controller
                             name="ballade_latitude"
                             control={control}
                             render={() => (
                                <TextField
                                {...register(
                                 'ballade_latitude',
                                  {
                                    required: 'Ce champ est requis'
                                  }
                                 )}

                                  onChange={(e) => setLatitude(e.target.value)}
                                  sx={{mt: 5, height: 50}}
                                  label="Latitude"
                                  variant="standard"
                                   />
                                   )}
                                    />
                                    {errors.ballade_latitude ? (
                                     <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_latitude?.message}</Alert>
                                     ) : ''}
                            <Controller
                                name="ballade_longitude"
                                control={control}
                                 render={() => (
                                  <TextField
                                  {...register(
                                  'ballade_longitude',
                                   {
                                   required: 'Ce champ est requis'
                                    }
                                    )}

                                    onChange={(e) => setLongitude(e.target.value)}
                                    sx={{mt: 5, height: 50}}
                                    label="Longitude"
                                     variant="standard"
                                      />
                                      )}
                                       />
                                       {errors.ballade_longitude ? (
                                        <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_longitude?.message}</Alert>
                                         ) : ''}


                            <Controller
                              name="ballade_description"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <TextField
                                   {...register(
                                       'ballade_description',
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
                                   value={ballade_description}
                                />
                              )}
                            />
                            <Box className='description-limit'>{ballade_description.length}/255 caractères</Box>
                            {errors.ballade_description ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_description?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="ballade_image"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <Input
                                   type='file'
                                   {...register('ballade_image')}
                                   onChange={(e) => setImage(e.target.files[0]) }
                                   sx={{mt: 5, height: 50}}
                                />
                              )}
                            />
                            {errors.ballade_image ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_image?.message}</Alert>
                            ) : ''}
                        </Grid>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="tag"
                              control={control}
                              defaultValue=""
                              render={() => (
                                  <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                      <InputLabel id="tag-select">Tag</InputLabel>
                                      <Select
                                        labelId="tag-select"
                                        id="tag-select"
                                        value={tag}
                                        label="Tag"
                                        onChange={(e) => setTag(e.target.value)}
                                        sx={{height: 50}}
                                        variant="outlined"
                                      >
                                      {tags.map((tag) => {
                                          return(
                                              <MenuItem key={tag.id} value={tag.id}>{tag.tag_name}</MenuItem>
                                          )
                                      })}
                                      </Select>
                                  </FormControl>
                              )}
                            />
                             <Controller
                              name="distance"
                              control={control}
                              render={() => (
                              <TextField
                              {...register(
                              'distance',
                               {
                                required: 'Ce champ est requis'
                                  }
                                    )}

                                     onChange={(e) => setDistance(e.target.value)}
                                     sx={{mt: 5, height: 50}}
                                     label="Distance en km"
                                     variant="standard"
                                      />
                                      )}
                                       />
                                        {errors.distance ? (
                                        <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.distance?.message}</Alert>
                                        ) : ''}
                                 <Controller
                                   name="denivele"
                                   control={control}
                                    render={() => (
                                     <TextField
                                       {...register(
                                       'denivele',
                                       {
                                       required: 'Ce champ est requis'
                                         }
                                         )}
                                         type="number"
                                         onChange={(e) => setDenivele(e.target.value)}
                                          sx={{mt: 5, height: 50}}
                                          label="Denivelé en m"
                                          variant="standard"
                                           />
                                            )}
                                             />
                                             {errors.denivele ? (
                                              <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.denivele?.message}</Alert>
                                              ) : ''}

                        </Grid>
                        <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                            <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
                        </Grid>
                    </Grid>
                </form>

            </Box>
        </Modal>

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

export default NewBallade;