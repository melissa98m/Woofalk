import React, {useEffect, useState} from "react";
import { Box, CardHeader, Container, Card, TableContainer, Table, TablePagination , Typography} from "@mui/material";



function PolitiqueConfidentialite() {

    document.title = "Politique Confidentialite";


    return <Container maxWidth="md" id='politique-confidentialite'>


    <Typography variant='h1' sx={{ fontSize: "30px" , fontWeight: "bold" , textAlign: "center"}}>Politique de confidentialité</Typography>
    <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "10px" , fontSize: "20px" , fontWeight: "bold" ,}}><strong>Introduction</strong></Typography>

    <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>Ce site Web, "Go with dog", est dédié à fournir des informations
    et des services à nos utilisateurs. Nous prenons la confidentialité de vos informations personnelles très au sérieux et nous nous engageons
     à protéger vos informations en conformité avec les lois applicables sur la protection des données.
    </Typography>

    <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}><strong>Collecte et utilisation des informations</strong></Typography>
    <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>Nous collectons des informations vous concernant lorsque vous vous inscrivez sur notre site,
     créez un compte, remplissez un formulaire ou effectuez un achat. Les informations que nous collectons peuvent inclure votre nom, votre adresse électronique, votre adresse postale et votre numéro de téléphone.</Typography>

   <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>Nous utilisons ces informations pour vous fournir les services que vous avez demandés,
   pour améliorer notre site et nos services, et pour vous tenir informé des offres et des mises à jour de notre site.
 </Typography>

 <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}><strong>Divulgation à des tiers</strong></Typography>
<Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>
 Nous ne vendrons, n'échangerons ni ne divulguerons à des tiers vos informations personnelles sans votre consentement, sauf dans les cas où cela est nécessaire pour fournir
 les services que vous avez demandés ou pour se conformer à la loi.</Typography>
  <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}>Sécurité</Typography>
   <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}> Nous prenons des mesures raisonnables pour protéger vos informations personnelles contre la perte,
   l'utilisation abusive ou l'altération. Toutefois, aucune transmission de données sur Internet ou méthode de stockage électronique n'est complètement sûre et
    nous ne pouvons pas garantir la sécurité absolue de vos informations personnelles.</Typography>
      <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}>Cookies</Typography>
        <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>Nous utilisons des cookies pour améliorer votre expérience sur notre site.
        Les cookies sont de petits fichiers de données qui sont stockés sur votre ordinateur lorsque vous visitez certains sites Web.
        Nous utilisons des cookies pour suivre les activités sur notre site et pour stocker vos préférences.</Typography>
 <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}><strong>Modifications de la politique de confidentialité</strong></Typography>
<Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>
 Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page et entrera en vigueur immédiatement.</Typography>
  <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}>Sécurité</Typography>
   <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}> Nous prenons des mesures raisonnables pour protéger vos informations personnelles contre la perte,
   l'utilisation abusive ou l'altération. Toutefois, aucune transmission de données sur Internet ou méthode de stockage électronique n'est complètement sûre et
    nous ne pouvons pas garantir la sécurité absolue de vos informations personnelles.</Typography>
      <Typography variant='h2' sx={{ textAlign: "center" , marginTop: "20px" , fontSize: "20px" , fontWeight: "bold" }}>Contactez-nous</Typography>
        <Typography variant='body2' sx={{ textAlign: "justify" , marginTop: "10px"}}>Si vous avez des questions concernant cette politique de confidentialité,
         veuillez nous contacter à l'adresse suivante: <a href="mailto:melissa.mangione+gowithdog@gmail.com?subject=Contact ï¿½ partir des mentions lï¿½gales via le site www.liendusit.fr">melissa.mangione+gowithdog@gmail.com</a>.
       Cette politique de confidentialité a été mise à jour pour la dernière fois le 2 février 2023.</Typography>



</Container>

}
export default PolitiqueConfidentialite;