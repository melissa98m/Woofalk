import {Box, Button, FormControl, Snackbar, Alert} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function DeleteAddress(props) {

    const [oneAddress, setOneAddress] = useState("");
    const [delAddress, setShowDelete] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteAddress = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/addresses/` + oneAddress.id)
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneAddress.id);
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
                aria-label="Supprimer l'adresse"
                onClick={ () => {
                    setShowDelete(true)
                    setOneAddress({id: props.deleteValue.id, address: props.deleteValue.address} )
                } }
            >
                Supprimer
            </RowActionButton>
            <CrudModal open={delAddress} onClose={() => setShowDelete(false)} title="Supprimer une adresse" titleId="delete-address-title">
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer l'adresse : {oneAddress.address} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" color="error" onClick={deleteAddress}>Supprimer</Button>
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

export default DeleteAddress