import {Box, Button, FormControl, Modal, Snackbar, TextField, Typography, Alert , Grid} from "@mui/material";
import {Edit} from "@mui/icons-material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from "../../config";

function EditTag(props) {
    const [id, setID] = useState("");
    const [tag_name, setName] = useState("");
    const [color, setColor] = useState('#ffffff');
    const [oneTag, setOneTag] = useState("");
    const [editTag, setShowEdit] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({ defaultValues: {
            tag_name: props.updateValue.tag_name,
            color: props.updateValue.color,
    } });

    let editTagForm = async () => {
        try {
            let updatedTag = {
                id: id ? id : parseInt(oneTag.id),
                tag_name:tag_name ? tag_name : oneTag.tag_name,
                color: color ? color : oneTag.color
            }
            let res = await axios.patch(`${API_URL}/api/tags/` + oneTag.id, {tag_name, color} , {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            })
            if (res.status === 200) {
                const foundIndex = props.updateValue.data.findIndex(x => x.id === oneTag.id);
                let data = update(props.updateValue.data, {[foundIndex]: {$set: updatedTag}})
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

const handleChange = (color) => {
    setColor(color)
  }

    return(<Box >
          <Button color='info' variant='contained' sx={{mx: 2}}
            onClick={() => {
                setShowEdit(true)
                setOneTag({id: props.updateValue.id, tag_name: props.updateValue.tag_name , color: props.updateValue.color})
            }}>
              <Edit/>
          </Button>
         <Modal
            id="modal-crud-container"
            hideBackdrop
            open={editTag}
            onClose={() => setShowEdit(false)}
            aria-labelledby="edit-tag-title"
            aria-describedby="child-modal-description"
        >
            <Box className="modal-crud modal-crud-tag" sx={{bgcolor: 'background.default'}}>
             <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                <Button variant="outlined"  color="secondary" onClick={() => setShowEdit(false)}><CloseIcon /></Button>
             </Grid>
                <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="edit-tag-title">Editer un tag de lieux</Typography>
                <form onSubmit={handleSubmit(editTagForm)}>
                <Grid container spacing={8}>
                 <Grid item xs={12} sx={{ display: 'flex',flexDirection: 'column' , textAlign: 'center' , justifyContent: 'center'}}>
                    <FormControl>
                          <Controller
                              name="tag_name"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'tag_name',
                                       {
                                           required: 'Ce champ est requis',
                                           minLength: {value: 5, message: 'Longueur minimale de 5 caractères'}
                                       }
                                   )}
                                   onChange={(e) => setName(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Nom du tag"
                                   variant="standard"
                                   defaultValue={tag_name}
                                />
                              )}
                            />
                            {errors.tag_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.tag_name?.message}</Alert>
                            ) : ''}
                            <Typography variant="body1">Couleur :</Typography>
                            <input type="color" id="color" name="color" required className="color-picker"
                            value={color} onChange={(e) => setColor(e.target.value)} label="Couleur"/>
                       </FormControl>
                        </Grid>
                        <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' , textAlign: 'center'}}>
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
export default EditTag;