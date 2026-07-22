import {Box, Button, FormControl, Modal, Snackbar, Typography, Alert , Grid} from "@mui/material";
import {useEffect, useState} from "react";
import update from "immutability-helper";
import {DeleteForeverRounded} from "@mui/icons-material";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import { API_URL } from "../../config";

function DeleteTag(props) {

    const [oneTag, setOneTag] = useState("");
    const [delTag, setShowDelete] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let deleteTag = async (e) => {
        e.preventDefault();
        try {
            let res = await axios.delete(`${API_URL}/api/tags/` + oneTag.id , {
                "headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') }
            })
            if (res.status === 200) {
                const foundIndex = props.deleteValue.data.findIndex(x => x.id === oneTag.id);
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
                    setOneTag({id: props.deleteValue.id, tag_name: props.deleteValue.tag_name} )
                } }
            >
                <DeleteForeverRounded/>
            </Button>
            <Modal
                id="modal-crud-container"
                hideBackdrop
                open={delTag}
                onClose={() => setShowDelete(false)}
                aria-labelledby="delete-tag-title"
                aria-describedby="child-modal-description"
            >
                <Box className="modal-crud modal-crud-tag" sx={{bgcolor: 'background.default'}}>
                <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' }}>
                 <Button variant="outlined"  color="secondary" onClick={() => setShowDelete(false)}><CloseIcon /></Button>
                  </Grid>
                    <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="delete-tag-title">Supprimer un tag de
                        ballade</Typography>
                    <FormControl>
                        <Box>
                            êtes vous sur de vouloir supprimer le tag : {oneTag.tag_name}?
                        </Box>
                        <Box className="action-button">
                            <Button sx={{m: 3}} type="submit" variant="contained" onClick={deleteTag}>Supprimer</Button>
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

export default DeleteTag