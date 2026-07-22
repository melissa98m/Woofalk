import {
    Box,
    Button,
    FormControl,
    Modal,
    Snackbar,
    TextField,
    Typography,
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
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from "../../config";

function EditBallade(props) {
    const [id, setID] = useState("");
    const [ballade_name, setName] = useState(props.updateValue.ballade_name);
    const [ballade_description, setDescription] = useState(props.updateValue.ballade_description);
    const [ballade_image, setImage] = useState('');
    const [ballade_latitude, setLatitude] = useState(props.updateValue.ballade_latitude);
    const [ballade_longitude , setLongitude] = useState(props.updateValue.ballade_longitude);
    const [distance , setDistance] = useState(props.updateValue.distance);
    const [ denivele , setDenivele] = useState(props.updateValue.denivele);
    const [cImage, setCImage] = useState(props.updateValue.ballade_image);

    // One of ...
    const [tag, setType] = useState(undefined);

    // List All
    const [tags, setTags] = useState({});

    const [oneBallade, setOneBallade] = useState("");
    const [editBallade, setShowEdit] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({ defaultValues: {
        ballade_name: props.updateValue.ballade_name,
        ballade_description: props.updateValue.ballade_description,
        ballade_longitude : props.updateValue.ballade_longitude,
        ballade_latitude: props.updateValue.ballade_latitude,
        distance: props.updateValue.distance,
        denivele: props.updateValue.denivele,
        ballade_image: props.updateValue.ballade_image,
        tag: props.updateValue.tag,


    } });

    useEffect( () => {
        getAlls()
    }, [])

    let getAlls = async () => {
        await axios.get(`${API_URL}/api/tags`).then((actualData) => { setTags(actualData.data.data) });
    }

    let editBalladeForm = async () => {
        try {

            let formData = new FormData();
            formData.append("ballade_name",  ballade_name);
            formData.append("ballade_description", ballade_description);
            formData.append("ballade_latitude", ballade_latitude);
            formData.append("ballade_longitude", ballade_longitude);
            formData.append("denivele", denivele);
            formData.append("distance", distance);
            formData.append("tag",  tag ? `${tag}` : `${props.updateValue.tag.id}`);
            if (ballade_image){
                formData.append("ballade_image", ballade_image);
            }
            formData.append("_method", 'PATCH');

            let updatedBallade = {
                id: id ? id : parseInt(oneBallade.id),
                ballade_name: ballade_name ? ballade_name : oneBallade.ballade_name,
                ballade_description: ballade_description ? ballade_description : oneBallade.ballade_description,
                ballade_latitude: ballade_latitude ? ballade_latitude : oneBallade.ballade_latitude,
                ballade_longitude: ballade_longitude ? ballade_longitude : oneBallade.ballade_longitude ,
                denivele: denivele ? denivele : oneBallade.denivele ,
                distance: distance ? distance : oneBallade.distance,
                ballade_image: ballade_image ? ballade_image : oneBallade.ballade_image,
                tag: tag ? tag : oneBallade.tag.id,
            }

            let res = await axios.post(`${API_URL}/api/ballades/` + oneBallade.id, formData, {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            })
            if (res.status === 200) {
                const foundIndex = props.updateValue.data.findIndex(x => x.id === oneBallade.id);
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
          <Button color='info' variant='contained' sx={{mx: 2}}
            onClick={() => {
                setShowEdit(true)
                setOneBallade({
                    id: props.updateValue.id,
                    ballade_name: props.updateValue.ballade_name,
                    ballade_description: props.updateValue.ballade_description,
                    ballade_longitude : props.updateValue.ballade_longitude,
                    ballade_latitude: props.updateValue.ballade_latitude,
                    denivele: props.updateValue.denivele,
                    distance: props.updateValue.distance,
                    ballade_image: props.updateValue.ballade_image,
                    tag: props.updateValue.tag,
                })
                setCImage(props.updateValue.ballade_image);
            }}>
              <Edit/>
          </Button>
         <Modal
            id="modal-crud-container"
            hideBackdrop
            open={editBallade}
            onClose={() => setShowEdit(false)}
            aria-labelledby="edit-ballade-title"
            aria-describedby="child-modal-description"
        >
            <Box className="modal-crud modal-crud-ballade" sx={{bgcolor: 'background.default'}}>
            <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
            <Button variant="outlined"  color="secondary" onClick={() => setShowEdit(false)}><CloseIcon /></Button>
             </Grid>
                <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="edit-ballade-title">Editer une balade</Typography>
                <form onSubmit={handleSubmit(editBalladeForm)}>
                    <Grid container spacing={8}>
                        <Grid item xs={6} sx={{ display: 'flex',flexDirection: 'column'}}>
                            <Controller
                              name="ballade_name"
                              control={control}
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
                                   defaultValue={ballade_name}
                                />
                              )}
                            />
                            {errors.ballade_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_name?.message}</Alert>
                            ) : ''}

                            <Controller
                              name="ballade_description"
                              control={control}
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
                                   defaultValue={ballade_description}
                                />
                              )}
                            />
                            <Box className='description-limit'>{ballade_description.length}/255 caractères</Box>
                            {errors.ballade_description ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_description?.message}</Alert>
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
                                 type="number"
                                  onChange={(e) => setLatitude(e.target.value)}
                                  sx={{mt: 5, height: 50}}
                                  label="Latitude"
                                  variant="standard"
                                  defaultValue={ballade_latitude}
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
                                    type="number"
                                    onChange={(e) => setLongitude(e.target.value)}
                                    sx={{mt: 5, height: 50}}
                                    label="Longitude"
                                     variant="standard"
                                      defaultValue={ballade_longitude}
                                      />
                                      )}
                                       />
                                       {errors.ballade_longitude ? (
                                        <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.ballade_longitude?.message}</Alert>
                                         ) : ''}

                            <Controller
                              name="ballade_image"
                              control={control}
                              render={() => (
                                  <Box sx={{ display: 'flex'}}>
                                      <Box component="img" src={`${API_URL}/storage/uploads/ballades/${cImage}`} alt={cImage} sx={{ width: "80px", mr: 3 }}/>
                                      <Input
                                       type='file'
                                       {...register('ballade_image')}
                                       onChange={(e) => setImage(e.target.files[0])}
                                       sx={{mt: 5, height: 50}}
                                      />
                                  </Box>
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
                              render={() => (
                                  <FormControl sx={{ m: 1, mt: 5, minWidth: 120 }} size="small">
                                      <InputLabel id="tag-select">Type</InputLabel>
                                      <Select
                                        labelId="tag-select"
                                        id="tag-select"
                                        defaultValue={props.updateValue.tag.id}
                                        label="Type"
                                        onChange={(e) => setType(e.target.value)}
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
                                    type="number"
                                     onChange={(e) => setDistance(e.target.value)}
                                      sx={{mt: 5, height: 50}}
                                      label="Distance en km"
                                      variant="standard"
                                       defaultValue={distance}
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
                                                              defaultValue={denivele}
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
export default EditBallade;