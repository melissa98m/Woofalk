import {Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Typography, Alert} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { API_URL } from "../../config";

function NewTag(props) {

    const [id, setID] = useState("");
    const [ tag_name, setName] = useState("");
    const [color , setColor] = useState("")
    const [scope, setScope] = useState("both");
    const [newTag, setShowNew] = useState(false);
    // Handle Toast event
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {
            tag_name: '',
            color:'#FFFF'
    }});

    let newTagForm = async () => {
        try {
            let res = await axios.post(`${API_URL}/api/tags`, {tag_name , color, scope})
            if (res.status === 200) {
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.newValue.data, {$push: [{id : tab.id, tag_name: tab.tag_name , color: tab.color, scope: tab.scope}]})
                props.handleDataChange(data);
                setName("");
                setColor("");
                setScope("both");
                setToastMessage({message: "Tag ajouté ! Vous pouvez en ajouter un autre", severity: "success"});
                setShowToast(true);
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
            }
        } catch (err) {
        }
    }

    return (<Box>
        <Button variant="contained" onClick={() => setShowNew(true)}>Ajouter un tag</Button>
        <CrudModal open={newTag} onClose={() => setShowNew(false)} title="Nouveau tag" titleId="new-tag-title">
                <form onSubmit={handleSubmit(newTagForm)} className="tagForm">
                    <FormControl>
                        <Controller
                          name="tag_name"
                          control={control}
                          defaultValue=""
                          render={() => (
                              <TextField
                               {...register(
                                   'tag_name',
                                   {
                                       required: 'Ce champ est requis',
                                       minLength: {value: 5, message: 'Longueur minimale de 5 caractères'}
                                   }
                               )}
                               aria-invalid={!!errors.tag_name}
                               aria-describedby={errors.tag_name ? "tag_name-error" : undefined}
                               onChange={(e) => setName(e.target.value)}
                               sx={{mt: 5, height: 50}}
                               label="Nom"
                               variant="standard"
                               value={tag_name}
                            />
                          )}
                        />
                        {errors.tag_name ? (
                            <Alert id="tag_name-error" sx={{mt:2, p:0, pl:2}} severity="error">{errors.tag_name?.message}</Alert>
                        ) : ''}
                         <Typography variant="body1">Couleur :</Typography>
                        <input type="color" id="color" name="color" required className="color-picker"
                             value={color} onChange={(e) => setColor(e.target.value)} label="Couleur"/>
                        <InputLabel id="new-tag-scope-label" sx={{mt: 3}}>S'applique à</InputLabel>
                        <Select
                            labelId="new-tag-scope-label"
                            id="new-tag-scope"
                            value={scope}
                            onChange={(e) => setScope(e.target.value)}
                        >
                            <MenuItem value="place">Lieux uniquement</MenuItem>
                            <MenuItem value="ballade">Balades uniquement</MenuItem>
                            <MenuItem value="hebergement">Hébergements uniquement</MenuItem>
                            <MenuItem value="both">Tout</MenuItem>
                        </Select>
                        <Box className="action-button">
                            <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
                        </Box>
                    </FormControl>
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

export default NewTag;