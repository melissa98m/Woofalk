import axios from "axios";
import { API_URL } from "../config";

// Keep these labels in sync with Report::SUBJECTS in woofalk-api (app/Models/Report.php).
export const REPORT_SUBJECTS = [
    "Contenu inapproprié",
    "Adresse ou localisation incorrecte",
    "Information erronée ou obsolète",
    "Lieu fermé ou n'existe plus",
    "Doublon",
    "Autre",
];

export const REPORT_SUBJECT_OTHER = "Autre";

export const reportItem = (type, id, subject, message) =>
    axios.post(`${API_URL}/api/${type}/${id}/report`, { subject, message });

export const getReports = () =>
    axios.get(`${API_URL}/api/reports`);

export const dismissReport = (id) =>
    axios.patch(`${API_URL}/api/reports/${id}/dismiss`);
