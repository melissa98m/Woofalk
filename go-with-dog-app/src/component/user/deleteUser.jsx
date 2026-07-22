import {Box, Button, FormControl, Modal, Snackbar, Typography, Alert , Grid} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
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
            <Button
                variant='contained'
                sx={{mx: 2}}
                onClick={ () => {
                    setShowDelete(true)
                    setOneUser({id: props.deleteValue.id, username: props.deleteValue.username} )
                } }
            >
                <DeleteForeverRounded/>
            </Button>
            <Modal
                id="modal-crud-container"
                hideBackdrop
                open={delUser}
                onClose={() => setShowDelete(false)}
                aria-labelledby="delete-user-title"
                aria-describedby="child-modal-description"
            >
                <Box className="modal-crud modal-crud-user" sx={{bgcolor: 'background.default'}}>
                 <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                 <Button variant="outlined"  color="secondary" onClick={() => setShowDelete(false)}><CloseIcon /></Button>
                  </Grid>
                    <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="delete-user-title">Supprimer l'utilisateur</Typography>
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer le lieu : {oneUser.username} ?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" onClick={deleteUser}>Supprimer</Button>
                        </Box>
                    </FormControl>
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

export default DeleteUser