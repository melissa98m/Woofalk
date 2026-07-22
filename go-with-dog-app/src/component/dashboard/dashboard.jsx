import React, {useEffect, useState} from "react";
import {
  Drawer,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button, Container , Box ,Link , Typography , Grid , useTheme
} from "@mui/material";

import PersonIcon from '@mui/icons-material/Person';
import PushPinIcon from '@mui/icons-material/PushPin';
import TagIcon from '@mui/icons-material/Tag';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import ApprovalIcon from '@mui/icons-material/Approval';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

function Dashboard() {

    document.title = "Dashboard";
       const theme = useTheme();

        const backgroundColor =
          theme.palette.type === "dark" ? "#9EA0A8" : "#B1B3C1"
        const color = theme.palette.type === "dark" ? "#fff" : "black"



    return <Container maxWidth="lg" id='dashboard'>

    <Grid container spacing={2}>
    <Grid id="dashboardMenu" item xs={4} sx={{ backgroundColor }}>
    <Typography variant="body">Dashboard</Typography>
    <Link href='/address' underline="none">
      <ListItem button >
        <BusinessIcon sx={{ color }} />
         <ListItemText sx={{ color }} primary="Gérer les adresses" />
         </ListItem>
 </Link>
 <Link href='/ballade' underline="none" >
       <ListItem button >
         <ApprovalIcon sx={{ color }} />
          <ListItemText sx={{ color }} primary="Gérer les ballades"  />
          </ListItem>
  </Link>
 <Link href='/category' underline="none">
       <ListItem button >
         <CategoryIcon sx={{ color }} />
          <ListItemText sx={{ color }} primary="Gérer les categories" />
          </ListItem>
  </Link>
  <Link href='/place' underline="none">
        <ListItem button >
          <PushPinIcon sx={{ color }} />
           <ListItemText sx={{ color }} primary="Gérer les lieux" />
           </ListItem>
   </Link>
   <Link href='/tag' underline="none">
         <ListItem button >
           <TagIcon sx={{ color }} />
            <ListItemText sx={{ color }} primary="Gérer les tags" />
            </ListItem>
    </Link>
    <Link href='/user' underline="none">
          <ListItem button >
            <PersonIcon sx={{ color }}  />
             <ListItemText sx={{ color }} primary="Gérer les utilisateurs" />
             </ListItem>
     </Link>
      </Grid>

      <Grid item xs={8}>
     <Typography variant="h5">Bienvenue sur votre dashboard</Typography>
     <Box  sx={{ marginTop: "10px"}}><Typography variant="body">Bonjour cher(e) Administrateur ,</Typography></Box>
     <Typography variant="body">Ici vous avez accés aux liens pour gérer les éléments du site </Typography> <br/>
     <Typography variant="body">Il suffit de cliquer sur les liens dans le menu de gauche et vous serez emmené au pages correspondantes </Typography>
     <Box sx={{ marginTop: "20px" }}><WarningAmberOutlinedIcon fontSize="large" /><Typography variant="body"  sx={{ marginLeft: "15px" }} >Les éléments  ne optimisés  pour une utilisation sur mobile ou tablette</Typography></Box>
     </Grid>

     </Grid>

</Container>

}
export default Dashboard;