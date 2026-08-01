import { MenuItem, Select, Tooltip } from "@mui/material";
import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

const ROLE_OPTIONS = [
    { value: "ROLE_USER", label: "Utilisateur" },
    { value: "ROLE_MODERATOR", label: "Modérateur" },
    { value: "ROLE_ADMIN", label: "Administrateur" },
];

// A user's `roles` array is always exactly one role (see
// AuthController::register and UserController::updateRoles), so a single
// dropdown is enough to cover the whole model.
function RoleSelect({ id, username, roles, isSelf, onRoleChange }) {

    const [loading, setLoading] = useState(false);
    const currentRole = roles.includes("ROLE_ADMIN")
        ? "ROLE_ADMIN"
        : roles.includes("ROLE_MODERATOR") ? "ROLE_MODERATOR" : "ROLE_USER";

    const handleChange = async (e) => {
        const nextRole = e.target.value;
        if (nextRole === currentRole || loading) return;

        setLoading(true);
        try {
            const res = await axios.patch(`${API_URL}/api/users/${id}/roles`, {
                roles: [nextRole],
            });
            onRoleChange(id, res.data.data.roles, null);
        } catch (err) {
            const message = err.response?.data?.message || "Une erreur est survenue";
            onRoleChange(id, null, message);
        } finally {
            setLoading(false);
        }
    };

    const select = (
        <Select
            size="small"
            variant="standard"
            value={currentRole}
            onChange={handleChange}
            disabled={isSelf || loading}
            aria-label={`Modifier le rôle de ${username ?? "l'utilisateur"}`}
            sx={{ fontSize: '13px', minWidth: 140 }}
        >
            {ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '13px' }}>{opt.label}</MenuItem>
            ))}
        </Select>
    );

    if (!isSelf) return select;

    return (
        <Tooltip title="Vous ne pouvez pas modifier votre propre rôle">
            <span>{select}</span>
        </Tooltip>
    );
}

export default RoleSelect;
