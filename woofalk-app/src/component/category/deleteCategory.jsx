import {Box, Button, FormControl, Snackbar, Alert} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function DeleteCategory(props) {

    const [oneCategory, setOneCategory] = useState("");
    const [delCategory, setShowDelete] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteCategory = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/categories/`+ oneCategory.id);
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneCategory.id);
                let data = update(props.deleteValue.data, {$splice: [[foundIndex, 1]]})
                props.handleDataChange(data, 'delete');
                setShowDelete(false)
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
            }
        } catch (err) {
            console.log(err);
        }
    }

    return(<Box>
            <RowActionButton
                danger
                icon={<DeleteForeverRounded fontSize="small"/>}
                aria-label="Supprimer la catégorie"
                onClick={ () => {
                    setShowDelete(true)
                    setOneCategory({id: props.deleteValue.id, category_name: props.deleteValue.category_name} )
                } }
            >
                Supprimer
            </RowActionButton>
            <CrudModal open={delCategory} onClose={() => setShowDelete(false)} title="Supprimer une catégorie" titleId="delete-brand-title">
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer : {oneCategory.category_name} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" color="error" onClick={deleteCategory}>Supprimer</Button>
                        </Box>
                    </FormControl>
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

export default DeleteCategory