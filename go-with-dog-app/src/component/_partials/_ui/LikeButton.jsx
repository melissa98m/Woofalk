import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import auth from "../../../services/auth/token";
import { likeItem, unlikeItem } from "../../../services/like";

// Heart toggle used on place/ballade cards and detail pages.
// `type` must match the API resource segment: "places" or "ballades".
export function LikeButton({ type, id, liked, likesCount = 0, onChange, size = "medium" }) {
    const [pending, setPending] = useState(false);
    const isLoggedIn = auth.loggedAndUser() || auth.loggedAndAdmin();

    if (!isLoggedIn) {
        return (
            <Tooltip title="Connectez-vous pour ajouter aux favoris">
                <IconButton
                    component={RouterLink}
                    to="/login"
                    aria-label="Se connecter pour ajouter aux favoris"
                    size={size}
                >
                    <FavoriteBorderIcon fontSize={size} />
                </IconButton>
            </Tooltip>
        );
    }

    const toggle = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (pending) return;
        setPending(true);
        try {
            const res = liked ? await unlikeItem(type, id) : await likeItem(type, id);
            onChange?.({ liked: res.data.is_liked, likesCount: res.data.likes_count });
        } catch {
            // La requête a échoué : l'état affiché reste inchangé, l'utilisateur peut réessayer.
        } finally {
            setPending(false);
        }
    };

    const label = liked ? "Retirer des favoris" : "Ajouter aux favoris";

    return (
        <Tooltip title={label}>
            <span>
                <IconButton
                    onClick={toggle}
                    aria-pressed={liked}
                    aria-label={likesCount > 0 ? `${label} (${likesCount})` : label}
                    disabled={pending}
                    size={size}
                    color={liked ? "error" : "default"}
                >
                    {liked ? <FavoriteIcon fontSize={size} /> : <FavoriteBorderIcon fontSize={size} />}
                </IconButton>
            </span>
        </Tooltip>
    );
}

export default LikeButton;
