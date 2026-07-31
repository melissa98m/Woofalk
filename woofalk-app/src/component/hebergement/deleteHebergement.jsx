import {Box, Button, FormControl, Snackbar, Alert} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function DeleteHebergement(props) {

    const [oneHebergement, setOneHebergement] = useState("");
    const [delHebergement, setShowDelete] = useState(false)
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteHebergement = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/hebergements/` + oneHebergement.id)
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneHebergement.id);
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
                aria-label="Supprimer l'hébergement"
                onClick={ () => {
                    setShowDelete(true)
                    setOneHebergement({id: props.deleteValue.id, hebergement_name: props.deleteValue.hebergement_name} )
                } }
            >
                Supprimer
            </RowActionButton>
            <CrudModal open={delHebergement} onClose={() => setShowDelete(false)} title="Supprimer un hébergement" titleId="delete-hebergement-title">
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer l'hébergement : {oneHebergement.hebergement_name} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" color="error" onClick={deleteHebergement}>Supprimer</Button>
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

export default DeleteHebergement
