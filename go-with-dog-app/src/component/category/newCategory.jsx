import {Box, Button, FormControl, Snackbar, TextField, Alert} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
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
        <Button variant="contained" onClick={() => setShowNew(true)}>Ajouter une catégorie</Button>
        <CrudModal open={newCategory} onClose={() => setShowNew(false)} title="Nouvelle catégorie" titleId="new-category-title">
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

export default NewCategory;