import {Box, Button, FormControl, Snackbar, Alert} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function DeleteBallade(props) {

    const [oneBallade, setOneBallade] = useState("");
    const [delBallade, setShowDelete] = useState(false)
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteBallade = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/ballades/` + oneBallade.id)
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneBallade.id);
                let data = update(props.deleteValue.data, {$splice: [[foundIndex, 1]]})
                props.handleDataChange(data, 'delete');
                setShowDelete(false)
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
            }
        } catch (err) {
        }
    }

    return(<Box>
            <RowActionButton
                danger
                icon={<DeleteForeverRounded fontSize="small"/>}
                aria-label="Supprimer la balade"
                onClick={ () => {
                    setShowDelete(true)
                    setOneBallade({id: props.deleteValue.id, ballade_name: props.deleteValue.ballade_name} )
                } }
            >
                Supprimer
            </RowActionButton>
            <CrudModal open={delBallade} onClose={() => setShowDelete(false)} title="Supprimer la balade" titleId="delete-ballade-title">
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer la balade : {oneBallade.ballade_name} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" color="error" onClick={deleteBallade}>Supprimer</Button>
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

export default DeleteBallade