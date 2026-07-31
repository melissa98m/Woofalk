import {Box, Button, FormControl, Modal, Snackbar, TextField, Typography, Alert, Input} from "@mui/material";
import {useState ,useEffect, useRef} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from "../../config";



function ResetPassword() {
document.title = 'Reinisialisé le mot de passe';

    const { token } = useParams();
     const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [message, setMessage] = useState('');
    const [btn, setBtn] = useState('');
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const navigate = useNavigate();
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {email: '' , password: '' , confirmPassword: '' , token : token}});

        const min = useRef()
        const max = useRef()
        const num = useRef()
        const spec = useRef()

        const minuscule = '(?=.*[a-z])'; // toutes les minuscules
        const majuscule = '(?=.*[A-Z])'; // toutes les majuscules
        const number = '(?=.*[0-9])'; // les nombres
        const special = '(?=.*[!@#:$%^&])'; // caracteres

        useEffect(() => {
                // Check if password contains a lowercase
                if (password.match(minuscule)) {
                    min.current.style.backgroundColor = "#4F9747"; // if yes, bg green
                } else {
                    min.current.style.backgroundColor = "#ce0033"; // if not, bg red
                }

                // Check if password contains a uppercase
                if (password.match(majuscule)) {
                    max.current.style.backgroundColor = "#4F9747"; // if yes, bg green
                } else {
                    max.current.style.backgroundColor = "#ce0033"; // if not, bg red
                }

                // Check if password contains a number
                if (password.match(number)) {
                    num.current.style.backgroundColor = "#4F9747"; // if yes, bg green
                } else {
                    num.current.style.backgroundColor = "#ce0033"; // if not, bg red
                }

                // Check if password contains a special character
                if (password.match(special)) {
                    spec.current.style.backgroundColor = "#4F9747"; // if yes, bg green
                } else {
                    spec.current.style.backgroundColor = "#ce0033"; // if not, bg red
                }

            }, [password])

   let resetPassword = async () => {

         const formData = new FormData();
         formData.append('email', email)
         formData.append('password', password)
         formData.append('passwordConfirmation', passwordConfirmation)
         formData.append('token' , token)
         await axios
         .post(`${API_URL}/api/reset-password`, formData ,
            setMessage(<Alert severity="success" autoHideDuration={3000}>Demande de reinitialisation envoyée</Alert>),
            setBtn(<Button color="secondary" href="/login">Retourner sur la page login</Button>)
          )
         .catch(({ response }) => {
           if (response.status != 200) {
               setMessage(<Alert severity="error" autoHideDuration={3000}>Erreur lors de la réinitialisation du mot de passe</Alert>)
           }
         });
     };

    return (
       <Box className="" sx={{bgcolor: 'background.default' , textAlign: 'center'}}>
                       <Typography variant="h1" sx={{textAlign: 'center', mb: 4 , fontSize: "25px" , fontWeight: "bold"}} id="new-category-title">Réinitialiser votre mot de passe</Typography>
                       <form onSubmit={handleSubmit(resetPassword)} className="reset-password">
                           <FormControl>
                            <Controller
                                 name="token"
                                 control={control}
                                 defaultValue={token}
                                 render={() => (
                                     <Input
                                      {...register(
                                          'token'
                                      )}
                                      type='hidden'
                                      value={token}
                                   />
                                 )}
                               />
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
                                <Controller
                                 name="password"
                                 control={control}
                                 defaultValue=""
                                 render={() => (
                                     <TextField
                                      {...register(
                                          'password',
                                          {
                                              required: 'Ce champ est requis'
                                          }
                                      )}
                                      onChange={(e) => setPassword(e.target.value)}
                                      style={{width: 400, height: 50}}
                                      label="Votre mot de passe"
                                      variant="standard"
                                      value={password}
                                   />
                                 )}
                               />
                               {errors.password ? (
                                   <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.password?.message}</Alert>
                               ) : ''}
                               <Box className="regex">
                                                       <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center'}}>
                                                           <Box ref={min} className="bubble"></Box>
                                                           <Box>Le mot de passe doit contenir au moins une minuscule</Box>
                                                       </Box>
                                                       <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center'}}>
                                                           <Box ref={max} className="bubble"></Box>
                                                           <Box>Le mot de passe doit contenir au moins une majuscule</Box>
                                                       </Box>
                                                       <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center'}}>
                                                           <Box ref={num} className="bubble"></Box>
                                                           <Box>Le mot de passe doit contenir au moins un chiffre</Box>
                                                       </Box>
                                                       <Box sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center'}}>
                                                           <Box ref={spec} className="bubble"></Box>
                                                           <Box>Le mot de passe doit contenir au moins un caractère spécial</Box>
                                                       </Box>
                               </Box>
                                <Controller
                                 name="passwordConfirmation"
                                 control={control}
                                 defaultValue=""
                                 render={() => (
                                     <TextField
                                      {...register(
                                          'passwordConfirmation',
                                          {
                                              required: 'Ce champ est requis'
                                          }
                                      )}
                                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                                      style={{width: 400, height: 50}}
                                      label="Confirmer le mot de passe"
                                      variant="standard"
                                      value={passwordConfirmation}
                                   />
                                 )}
                               />
                               {errors.passwordConfirmation ? (
                                   <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.passwordConfirmation?.message}</Alert>
                               ) : ''}

                               <Box className="action-button">
                                   <Button type="submit" sx={{m: 3}} variant="contained">Envoyer</Button>
                                    {message}
                                    {btn}
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
    );
}

export default ResetPassword;