import {Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, TextField, Alert} from "@mui/material";
import {Edit} from "@mui/icons-material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";


function EditCategory(props) {
    const [id, setID] = useState("");
    const [category_name, setName] = useState("");
    const [scope, setScope] = useState(props.updateValue.scope ?? 'place');
    const [oneCategory, setOneCategory] = useState("");
    const [editCategory, setShowEdit] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    const { register, control, handleSubmit, formState: { errors } } = useForm({ defaultValues: {category_name: props.updateValue.category_name} });

    let editCategoryForm = async () => {
        try {
            let updatedCategory = {
                id: id ? id : parseInt(oneCategory.id),
                category_name: oneCategory.category_name ? category_name : oneCategory.category_name,
                scope: scope ? scope : oneCategory.scope,
            }
            let res = await axios.patch(`${API_URL}/api/categories/`+oneCategory.id, {category_name, scope});
            if (res.status === 200) {
                const foundIndex = props.updateValue.data.findIndex(x => x.id === oneCategory.id);
                let data = update(props.updateValue.data, {[foundIndex]: {$set: updatedCategory}})
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
                setOneCategory({id: props.updateValue.id, category_name: props.updateValue.category_name, scope: props.updateValue.scope})
                setScope(props.updateValue.scope ?? 'place')
            }}>
              Modifier
          </RowActionButton>
         <CrudModal open={editCategory} onClose={() => setShowEdit(false)} title="Éditer une catégorie" titleId="edit-category-title">
                <form onSubmit={handleSubmit(editCategoryForm)}>
                    <FormControl>
                          <Controller
                              name="category_name"
                              control={control}
                              render={() => (
                                  <TextField
                                   {...register(
                                       'category_name',
                                       {
                                           required: 'Ce champ est requis',
                                       }
                                   )}
                                   onChange={(e) => setName(e.target.value)}
                                   sx={{mt: 5, height: 50}}
                                   label="Nom"
                                   variant="standard"
                                   defaultValue={category_name}
                                />
                              )}
                            />
                            {errors.category_name ? (
                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.category_name?.message}</Alert>
                            ) : ''}
                        <InputLabel id="edit-category-scope-label" sx={{mt: 3}}>S'applique à</InputLabel>
                        <Select
                            labelId="edit-category-scope-label"
                            id="edit-category-scope"
                            value={scope}
                            onChange={(e) => setScope(e.target.value)}
                        >
                            <MenuItem value="place">Lieux uniquement</MenuItem>
                            <MenuItem value="hebergement">Hébergements uniquement</MenuItem>
                            <MenuItem value="both">Lieux et hébergements</MenuItem>
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
export default EditCategory;