import axios from "axios";
import { API_URL } from "../config";

// `type` must match the API resource segment: "places", "ballades", or "hebergements".
export const getComments = (type, id) =>
    axios.get(`${API_URL}/api/${type}/${id}/comments`);

export const addComment = (type, id, body) =>
    axios.post(`${API_URL}/api/${type}/${id}/comments`, { body });

export const updateComment = (id, body) =>
    axios.patch(`${API_URL}/api/comments/${id}`, { body });

export const deleteComment = (id) =>
    axios.delete(`${API_URL}/api/comments/${id}`);
