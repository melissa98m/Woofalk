import React, {useEffect, useState} from "react";
import { Box, CardHeader, Container, Card, TableContainer, Table, TablePagination} from "@mui/material";
import axios from "axios";
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoupeIcon from '@mui/icons-material/Loupe';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import AdminMessage from "../../services/auth/adminMessage";
import Grid from '@mui/material/Grid';
import { API_URL } from "../../config";




function Account() {

    document.title = "Mon compte";

    const [user, setUser] = useState(null); // array of data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [places , setPlaces] = useState([]);
    const [ballades , setBallades] = useState([]);
    const [data, setData] = useState(null);



       const handleDataChange = async (dataChange) => {
            await setUser(dataChange)
        }



    useEffect(() => {
        axios.get(`${API_URL}/api/current-user`
        ,{"headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') } }).then((actualData) => {
            //actualData = actualData.data;
            setLoading(true)
            setUser(actualData.data);
            getPlaces();
            getBallades();
            setError(null);
        }).catch((err) => {
            setError(err.message);
            setUser(null);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    let getPlaces = async () => {
            await axios.get(`${API_URL}/api/places-user` ,
            {"headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') } }).then((actualData) => {
            setPlaces(actualData.data.data)
            })

            }

      let getBallades = async () => {
                await axios.get(`${API_URL}/api/ballades-user` ,
                {"headers" : { "Authorization":"Bearer"+localStorage.getItem('access_token') } }).then((actualData) => {
                setBallades(actualData.data.data)
                })
                }

    return <Container maxWidth="xl" id='home'>

        <Typography variant="h2" sx={{textAlign: "center" , marginTop: "35px"}} gutterBottom>Mon compte</Typography>
        {loading ? (
            <Typography variant="body" sx={{textAlign: "center"}} gutterBottom>Chargement de votre compte</Typography>
        ) : (
            <Box sx={{textAlign: "center" , marginTop: "10px" ,  marginBottom: "5%" , marginLeft: "auto" , marginRight: "auto" , maxWidth: "70%" ,
                              backgroundColor: "#B1B3C1" , borderRadius: "10px" , marginBottom: "10px" , padding : "10px"}}>
                              <Typography variant="h3" sx={{ textAlign: "center" , fontSize: "30px" }}>Informations personnelles</Typography><br/>
                      <Typography variant="body" sx={{ marginTop: "10px" }}><strong> Username : </strong>{user.username}</Typography><br/>
                      <Typography variant="body" sx={{ marginTop: "10px" }}><strong> Email : </strong>{user.email}</Typography><br/>
                      <Typography variant="body" sx={{ marginTop: "10px" }}><strong> Date de création : </strong>{user.created_at.slice(0,10)}</Typography><br/>
                      <Button href="/change-password" variant="outlined" color="secondary">Changer de mot de passe</Button>
           </Box>
        )
        }
         <Typography variant="h4" sx={{textAlign: "left"}} >Places que vous avez créée</Typography>
        {loading ? (
                    <Typography variant="body" sx={{textAlign: "center"}} gutterBottom>Chargement des places...</Typography>
                ) : (
                    <Box sx={{ maxWidth: '100%' }}>
                                {places.map(({id, place_name, place_description , place_image, category, created_at, address}) => {
                        return (
                       <Card sx={{ display: 'inline-block' , margin: '10px' , width: '200px'}} key={id}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                src={`${API_URL}/storage/uploads/places/${place_image}`}
                                                alt={place_name}
                                            />
                                            <CardContent>
                                                <Typography gutterBottom variant="h5" component="div">
                                                    {place_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {place_description.slice(0,30)}
                                                </Typography>
                                                <Typography gutterBottom variant="body2" component="div">
                                                  Créer le:{created_at.slice(0,10)}
                                                </Typography>
                                            </CardContent>

                                        </Card>

                    )
                })}
                    </Box>


                )
                }
                <Typography variant="h4" sx={{textAlign: "left"}} >Ballades que vous avez créée</Typography>
                        {loading ? (
                                    <Typography variant="body" sx={{textAlign: "center"}} gutterBottom>Chargement des ballades...</Typography>
                                ) : (
                                    <Box sx={{ maxWidth: '100%' }}>
                                                {ballades.map(({id, ballade_name, ballade_description, ballade_image, tag,  ballade_latitude , ballade_longitude,denivele , distance ,created_at , data}) => {
                                        return (
                                       <Card sx={{ display: 'inline-block' , margin: "10px" , width: '200px'}} key={id}>
                                                            <CardMedia
                                                                component="img"
                                                                height="140"
                                                                src={`${API_URL}/storage/uploads/ballades/${ballade_image}`}
                                                                alt={ballade_name}
                                                            />
                                                            <CardContent>
                                                                <Typography gutterBottom variant="h5" component="div">
                                                                    {ballade_name}
                                                                </Typography>
                                                                <Typography gutterBottom variant="body2" component="div" color={tag.color}>
                                                                  {tag.tag_name}
                                                                 </Typography>
                                                                 <Typography gutterBottom variant="body2" component="div">
                                                                    Créer le:{created_at.slice(0,10)}
                                                                </Typography>
                                                            </CardContent>

                                                        </Card>

                                    )
                                })}
                                    </Box>


                                )
                                }

</Container>

}
export default Account;