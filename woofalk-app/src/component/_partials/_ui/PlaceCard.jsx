import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";
import { LikeButton } from "./LikeButton";
import { truncateLabel } from "./truncateLabel";

const MAX_VISIBLE_TAGS = 3;

// Shared place listing card, used by the home page and the public places list.
export function PlaceCard({ place }) {
    const { id, place_name, place_image, category, address, tags, is_liked, likes_count } = place;
    const [like, setLike] = useState({ liked: !!is_liked, count: likes_count ?? 0 });

    return (
        <Card component="article">
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img"
                    height="150"
                    src={`${API_URL}/storage/uploads/places/${place_image}`}
                    alt={place_name}
                />
                <Box sx={{ position: "absolute", top: 6, right: 6, bgcolor: "background.paper", borderRadius: "50%", boxShadow: 1 }}>
                    <LikeButton
                        type="places"
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
                    {place_name}
                </Typography>
                {address ? (
                    <Typography variant="body2" color="text.secondary">
                        {address.address}, {address.city}
                    </Typography>
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
                <Button component={Link} to={`/places/${id}`} variant="contained">Voir détails</Button>
            </CardActions>
        </Card>
    );
}

export default PlaceCard;
