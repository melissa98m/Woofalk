import { useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { API_URL } from "../../config";
import auth from "./token";

function Logout () {
    let navigate = useNavigate();

    useEffect(() => {
        // The JWT lives in an httpOnly cookie the front-end can't touch —
        // logging out has to ask the server to blacklist it and clear the
        // cookie; clearing the local cache alone would leave the cookie
        // (and the session it grants) live.
        axios.post(`${API_URL}/api/logout`).finally(() => {
            auth.clearSession();
            navigate("/");
        });
    }, []);

    return null;
}

export default Logout
