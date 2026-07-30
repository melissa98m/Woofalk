import axios from "axios";
import { API_URL } from "../config";
import auth from "./auth/token";

const authHeaders = () => ({ Authorization: `Bearer ${auth.getToken()}` });

export const likeItem = (type, id) =>
    axios.post(`${API_URL}/api/${type}/${id}/like`, null, { headers: authHeaders() });

export const unlikeItem = (type, id) =>
    axios.delete(`${API_URL}/api/${type}/${id}/like`, { headers: authHeaders() });

export const getLikedPlaces = () =>
    axios.get(`${API_URL}/api/places-liked`, { headers: authHeaders() });

export const getLikedBallades = () =>
    axios.get(`${API_URL}/api/ballades-liked`, { headers: authHeaders() });

export const getLikedHebergements = () =>
    axios.get(`${API_URL}/api/hebergements-liked`, { headers: authHeaders() });
