import {Box, Button, FormControl, Snackbar, Typography, Alert, Grid} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import axios from "axios";
import { CrudModal } from "../_partials/_ui/CrudModal";
import { API_URL } from "../../config";
import { AddressSearchField } from "./AddressSearchField";

function NewAddress(props) {

    const [selected, setSelected] = useState(null);
    const [selectError, setSelectError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [newAddress, setShowNew] = useState(false);
    // Handle Toast event
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});

    let newAddressForm = async (e) => {
        e.preventDefault();
        if (!selected) {
            setSelectError("Choisissez une adresse dans la liste");
            return;
        }
        setSelectError("");
        setSubmitting(true);
        try {
            let res = await axios.post(`${API_URL}/api/addresses`, {
                address: selected.address, city: selected.city, postal_code: selected.postal_code,
                latitude: selected.latitude, longitude: selected.longitude
            })
            if (res.status === 200) {
                let tab = {};
                await Object.assign(tab, res.data.data);
                let data = update(props.newValue.data, {$push: [{id : tab.id, address: tab.address , city: tab.city,
                postal_code: tab.postal_code , latitude: tab.latitude , longitude: tab.longitude
                }]})
                props.handleDataChange(data);
                setSelected(null);
                setToastMessage({message: "Address ajouté ! Vous pouvez en ajouter une autre", severity: "success"});
                setShowToast(true);
            } else {
                setToastMessage({message: "Une erreur est survenue", severity: "error"});
                setShowToast(true);
            }
        } catch (err) {
            setToastMessage({message: "Une erreur est survenue", severity: "error"});
            setShowToast(true);
        } finally {
            setSubmitting(false);
        }
    }

    return (<Box>
        <Button variant="contained" onClick={() => setShowNew(true)}>Ajouter une adresse</Button>
        <CrudModal open={newAddress} onClose={() => setShowNew(false)} title="Nouvelle adresse" titleId="new-address-title">
                <form onSubmit={newAddressForm} className="addressForm">
                    <Grid container spacing={8}>
                    <Grid item xs={12} sx={{ display: 'flex',flexDirection: 'column' , textAlign: 'center' , justifyContent: 'center'}}>
                    <FormControl sx={{ width: '100%' }}>
                        <AddressSearchField
                          value={selected}
                          onSelect={(value) => { setSelected(value); setSelectError(""); }}
                          label="Adresse"
                          variant="standard"
                          sx={{mt: 5}}
                        />
                    </FormControl>
                    {selectError ? (
                        <Alert sx={{mt:2, p:0, pl:2}} severity="error">{selectError}</Alert>
                    ) : ''}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Le code postal, la ville et les coordonnées GPS sont récupérés automatiquement.
                    </Typography>
                    </Grid>
                    <Grid item xs={12} className="action-button" sx={{ minwidth: '100%' , textAlign: 'center'}}>
                            <Button type="submit" sx={{m: 3}} variant="contained" disabled={submitting}>{submitting ? "Envoi..." : "Envoyer"}</Button>
                     </Grid>
                    </Grid>
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

export default NewAddress;
