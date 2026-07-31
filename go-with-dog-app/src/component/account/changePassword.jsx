import {Box, Button, FormControl, Modal, Snackbar, TextField, Typography, Alert, Input , InputLabel , InputAdornment ,  IconButton} from "@mui/material";
import {useEffect, useRef, useState} from "react";
import update from "immutability-helper";
import {useForm, Controller} from "react-hook-form";
import axios from "axios";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import { API_URL } from "../../config";



const ChangePassword = () => {

 document.title = 'Changer mon mot de passe'

    const [old_password , setOlderPassword] = useState("");
  const [ new_password, setNewPassword ] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
    const [toast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({});
    const { register, control, handleSubmit, formState: { errors } } = useForm({defaultValues: {contact_email: '' ,
    contact_content: '' , contact_subject: ''
    }});
    const [message , setMessage] = useState("");
    const min = useRef()
        const max = useRef()
        const num = useRef()
        const spec = useRef()

        const minuscule = '(?=.*[a-z])'; // toutes les minuscules
        const majuscule = '(?=.*[A-Z])'; // toutes les majuscules
        const number = '(?=.*[0-9])'; // les nombres
        const special = '(?=.*[!@#:$%^&])'; // caracteres

    //Méthode d'ajout de joueurs
     const UpdatePassword = async () => {
       //e.preventDefault();
       const formData = new FormData();
       formData.append("old_password", old_password);
       formData.append("new_password", new_password);
       formData.append("confirm_password", confirm_password);
       await axios
         .post(`${API_URL}/api/users/change-password`, formData ,
         setMessage(<Alert severity="success" autoHideDuration={3000}>Mot de passe modifié</Alert>))
         .catch(({ response }) => {
           if (response.status != 200) {
           setMessage(<Alert severity="danger" autoHideDuration={3000}>Mot de passe non modifié</Alert>)
           }
         });
     };
     useEffect(() => {
             // Check if password contains a lowercase
             if (new_password.match(minuscule)) {
                 min.current.style.backgroundColor = "#4F9747"; // if yes, bg green
             } else {
                 min.current.style.backgroundColor = "#ce0033"; // if not, bg red
             }

             // Check if password contains a uppercase
             if (new_password.match(majuscule)) {
                 max.current.style.backgroundColor = "#4F9747"; // if yes, bg green
             } else {
                 max.current.style.backgroundColor = "#ce0033"; // if not, bg red
             }

             // Check if password contains a number
             if (new_password.match(number)) {
                 num.current.style.backgroundColor = "#4F9747"; // if yes, bg green
             } else {
                 num.current.style.backgroundColor = "#ce0033"; // if not, bg red
             }

             // Check if password contains a special character
             if (new_password.match(special)) {
                 spec.current.style.backgroundColor = "#4F9747"; // if yes, bg green
             } else {
                 spec.current.style.backgroundColor = "#ce0033"; // if not, bg red
             }

         }, [new_password])


          const handleClickShowPassword = () => {
                if (!showPassword) {
                    setShowPassword(true)
                } else {
                    setShowPassword(false)
                }
            };
             const handleClickShowPassword2 = () => {
                            if (!showPassword2) {
                                setShowPassword2(true)
                            } else {
                                setShowPassword2(false)
                            }
                        };


    return (
             <Box className="" sx={{bgcolor: 'background.default' , marginLeft: "50px"}}>
                            <Typography variant="h4" sx={{textAlign: 'center', mb: 4}} id="new-category-title">Changer de mot de passe</Typography>
                            <form onSubmit={handleSubmit(UpdatePassword)} className="update-password">
                                <FormControl>
                                    <Controller
                                      name="old_password"
                                      control={control}
                                      defaultValue=""
                                      render={() => (
                                          <TextField
                                           {...register(
                                               'old_password',
                                               {
                                                   required: 'Ce champ est requis'
                                               }
                                           )}
                                           onChange={(e) => setOlderPassword(e.target.value)}
                                           style={{width: 400, height: 50}}
                                           label="Ancien mot de passe"
                                           variant="standard"
                                           value={old_password}
                                        />
                                      )}
                                    />
                                    {errors.old_password ? (
                                        <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.old_password?.message}</Alert>
                                    ) : ''}
                                     <Controller
                                                              name="new_password"
                                                              control={control}
                                                              defaultValue=""
                                                              render={() => (
                                                                  <TextField
                                                                   {...register(
                                                                       'new_password',
                                                                       {
                                                                           required: 'Ce champ est requis'
                                                                       }
                                                                   )}
                                                                   onChange={(e) => setNewPassword(e.target.value)}
                                                                   style={{width: 400, height: 50}}
                                                                   label="Nouveau mot de passe"
                                                                   variant="standard"
                                                                   value={new_password}
                                                                />
                                                              )}
                                                            />
                                                            {errors.new_password ? (
                                                                <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.new_password?.message}</Alert>
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
                                                                   name="confirm_password"
                                                                   control={control}
                                                                   defaultValue=""
                                                                   render={() => (
                                                                       <TextField
                                                                        {...register(
                                                                            'confirm_password',
                                                                            {
                                                                                required: 'Ce champ est requis'
                                                                            }
                                                                        )}
                                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                                        style={{width: 400, height: 50}}
                                                                        label="Confirmer le mot de passe"
                                                                        variant="standard"
                                                                        value={confirm_password}
                                                                     />
                                                                   )}
                                                                 />
                                                                 {errors.confirm_password ? (
                                                                     <Alert sx={{mt:2, p:0, pl:2}} severity="error">{errors.confirm_password?.message}</Alert>
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

export default ChangePassword;