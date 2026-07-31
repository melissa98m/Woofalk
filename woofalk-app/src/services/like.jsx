import axios from "axios";
import { API_URL } from "../config";

export const likeItem = (type, id) =>
    axios.post(`${API_URL}/api/${type}/${id}/like`);

export const unlikeItem = (type, id) =>
    axios.delete(`${API_URL}/api/${type}/${id}/like`);

export const getLikedPlaces = () =>
    axios.get(`${API_URL}/api/places-liked`);

export const getLikedBallades = () =>
    axios.get(`${API_URL}/api/ballades-liked`);

export const getLikedHebergements = () =>
    axios.get(`${API_URL}/api/hebergements-liked`);
