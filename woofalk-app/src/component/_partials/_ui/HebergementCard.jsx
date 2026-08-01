import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";
import { LikeButton } from "./LikeButton";
import { truncateLabel } from "./truncateLabel";

const MAX_VISIBLE_TAGS = 3;

// Shared hebergement listing card, used by the home page and the public hebergements list.
export function HebergementCard({ hebergement }) {
    const { id, hebergement_name, hebergement_image, category, address, price_indication, tags, is_liked, likes_count } = hebergement;
    const [like, setLike] = useState({ liked: !!is_liked, count: likes_count ?? 0 });

    return (
        <Card component="article">
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img"
                    height="150"
                    loading="lazy"
                    src={`${API_URL}/storage/uploads/hebergements/${hebergement_image}`}
                    alt={hebergement_name}
                />
                <Box sx={{ position: "absolute", top: 6, right: 6, bgcolor: "background.paper", borderRadius: "50%", boxShadow: 1 }}>
                    <LikeButton
                        type="hebergements"
                        id={id}
                        liked={like.liked}
                        likesCount={like.count}
                        size="small"
                        onChange={({ liked, likesCount }) => setLike({ liked, count: likesCount })}
                    />
                </Box>
            </Box>
            <CardContent>
                {category ? (
                    <Chip size="small" label={category.category_name} sx={{ bgcolor: "sageSoft", color: "sageDark", mb: 1 }} />
                ) : null}
                <Typography gutterBottom variant="h6" component="h3" sx={{ mt: 1, mb: 0.5 }}>
                    {hebergement_name}
                </Typography>
                {address ? (
                    <Typography variant="body2" color="text.secondary">
                        {address.address}, {address.city}
                    </Typography>
                ) : null}
                {price_indication ? (
                    <Chip size="small" variant="outlined" label={price_indication} sx={{ mt: 1 }} />
                ) : null}
                {tags && tags.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: 1.5 }}>
                        {tags.slice(0, MAX_VISIBLE_TAGS).map((t) => (
                            <Chip
                                key={t.id}
                                size="small"
                                variant="outlined"
                                label={`#${truncateLabel(t.tag_name)}`}
                                title={t.tag_name}
                                sx={{ color: t.color, borderColor: t.color }}
                            />
                        ))}
                        {tags.length > MAX_VISIBLE_TAGS ? (
                            <Chip size="small" variant="outlined" label={`+${tags.length - MAX_VISIBLE_TAGS}`} title={tags.slice(MAX_VISIBLE_TAGS).map((t) => t.tag_name).join(", ")} />
                        ) : null}
                    </Box>
                ) : null}
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button component={Link} to={`/hebergements/${id}`} variant="contained" aria-label={`Voir les détails de ${hebergement_name}`}>Voir détails</Button>
            </CardActions>
        </Card>
    );
}

export default HebergementCard;
