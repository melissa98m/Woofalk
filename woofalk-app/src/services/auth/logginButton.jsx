import {AppBar, Box, Button} from "@mui/material";
import {useEffect, useState} from "react";
import auth from './token';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

export function LogginButton() {

    const tokenHere = auth.getToken() && auth.getExpiryTime();
    const [href, setHref] = useState('login')
    const [message, setMessage] = useState(<PersonAddAltIcon/>)

    useEffect(() => {
        if (tokenHere){
            setHref('logout')
            setMessage(<LogoutOutlinedIcon />)
        }
    }, [tokenHere])

    return (
        <Button href={href} color="secondary" aria-label={href === 'logout' ? 'Se déconnecter' : 'Se connecter'}>{message}</Button>
    )
}