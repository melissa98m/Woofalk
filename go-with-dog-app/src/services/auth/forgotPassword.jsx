import {Box, Button, FormControl, Modal, Snackbar, TextField, Typography, Alert, Input} from "@mui/material";
import {useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import { API_URL } from "../../config";



const ForgotPassword = () => {
 document.title = 'Mot de passe oublié'

    const [id, setID] = useState("");
  const [email, setEmail] = useState("");
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {email: ''}});
    const [message , setMessage] = useState("");


     const ForgotPasswordForm = async () => {
       const formData = new FormData();
       formData.append("email", email);
       await axios
         .post(`${API_URL}/api/forgot-password`, formData ,
         setMessage(<Alert severity="success" autoHideDuration={3000}>Demande de reinitialisation envoyée</Alert>))
         .catch(({ response }) => {
           if (response.status != 200) {
               setMessage(<Alert severity="error" autoHideDuration={3000}>Erreur lors de l'envoi de la demande</Alert>)
           }
         });
     };

    return (
            <Box className="" sx={{bgcolor: 'background.default' , textAlign: 'center'}}>
                <Typography variant="h1" sx={{textAlign: 'center', mb: 4 , fontSize: "25px" , fontWeight: "bold"}} id="new-category-title">Mot de passe oublié</Typography>
                <Typography variant="body" sx={{textAlign: 'center', mb: 4}}>Vous avez oublié votre mot de passe ? Pas de problèmes , remplissez ce formulaire et un mail vous sera envoyé avec un lien pour reinitialiser votre mot de passe </Typography>
                <form onSubmit={handleSubmit(ForgotPasswordForm)} className="forgot-password">
                    <FormControl>
                        <Controller
                          name="email"
                          control={control}
                          defaultValue=""
                          render={() => (
                              <TextField
                               {...register(
                                   'email',
                                   {
                                       required: 'Ce champ est requis'
                                   }
                               )}
                               onChange={(e) => setEmail(e.target.value)}
                               style={{width: 400, height: 50}}
                               label="Votre email"
                               variant="standard"
                               value={email}
                            />
                          )}
                        />
                        {errors.email ? (
                            <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.email?.message}</Alert>
                        ) : ''}
                        <Box className="action-button">
                            <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
                             {message}
                        </Box>
                    </FormControl>
                </form>
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
};

export default ForgotPassword;