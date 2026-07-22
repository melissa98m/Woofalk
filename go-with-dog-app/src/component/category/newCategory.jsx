import {Box, Button, FormControl, Modal, Snackbar, TextField, Typography, Alert, Input , Grid} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from "../../config";

function NewCategory(props) {

    const [id, setID] = useState("");
    const [category_name, setName] = useState("");
    const [newCategory, setShowNew] = useState(false);
    // Handle Toast event
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {category_name: ''}});

    let newCategoryForm = async () => {
        try {
            let res = await axios.post(`${API_URL}/api/categories`, {category_name}, {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            });
            if (res.status === 200) {
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.newValue.data, {$push: [{id : tab.id, category_name: tab.category_name}]})
                props.handleDataChange(data);
                setName("");
                setToastMessage({message: "Marque ajouté ! Vous pouvez en ajouter un autre", severity: "success"});
                setShowToast(true);
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (<Box>
        <Button variant="contained" onClick={() => setShowNew(true)}>Ajouter</Button>
        <Modal
            id="modal-crud-container"
            hideBackdrop
            open={newCategory}
            onClose={() => setShowNew(false)}
            aria-labelledby="new-category-title"
            aria-describedby="child-modal-description"
        >
            <Box className="modal-crud modal-crud-ballade" sx={{bgcolor: 'background.default'}}>
              <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
               <Button variant="outlined"  color="secondary" onClick={() => setShowNew(false)}><CloseIcon /></Button>
                </Grid>
                <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="new-category-title">Nouvelle categorie de vin</Typography>
                <form onSubmit={handleSubmit(newCategoryForm)}>
                    <FormControl>
                        <Controller
                          name="category_name"
                          control={control}
                          defaultValue=""
                          render={() => (
                              <TextField
                               {...register(
                                   'category_name',
                                   {
                                       required: 'Ce champ est requis'
                                   }
                               )}
                               onChange={(e) => setName(e.target.value)}
                               sx={{mt: 5, height: 50}}
                               label="Nom"
                               variant="standard"
                               value={category_name}
                            />
                          )}
                        />
                        {errors.category_name ? (
                            <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.category_name?.message}</Alert>
                        ) : ''}
                        <Box className="action-button">
                            <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
                        </Box>
                    </FormControl>
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

export default NewCategory;