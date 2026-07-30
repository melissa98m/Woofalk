import {Box, Button, FormControl, Snackbar, Alert} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { RowActionButton } from "../_partials/_ui/RowActionButton";
import { API_URL } from "../../config";

function DeleteUser(props) {

    const [oneUser, setOneUser] = useState("");
    const [delUser, setShowDelete] = useState(false)
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteUser = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/users/` + oneUser.id , {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            })
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneUser.id);
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
                aria-label="Supprimer l'utilisateur"
                onClick={ () => {
                    setShowDelete(true)
                    setOneUser({id: props.deleteValue.id, username: props.deleteValue.username} )
                } }
            >
                Supprimer
            </RowActionButton>
            <CrudModal open={delUser} onClose={() => setShowDelete(false)} title="Supprimer l'utilisateur" titleId="delete-user-title">
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer l'utilisateur : {oneUser.username} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" color="error" onClick={deleteUser}>Supprimer</Button>
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

export default DeleteUser