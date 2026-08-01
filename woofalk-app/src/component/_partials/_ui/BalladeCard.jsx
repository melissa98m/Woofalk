import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";
import { LikeButton } from "./LikeButton";
import { truncateLabel } from "./truncateLabel";
import { formatDistance } from "./formatDistance";

const MAX_VISIBLE_TAGS = 3;

// Difficulty/length tags are auto-assigned server-side (see Ballade::difficultyAndLengthTagNames)
// from dénivelé/distance; reuse their color to tint the corresponding chip's border.
const DENIVELE_TAG_NAMES = ["Facile", "Moyen", "Difficile"];
const DISTANCE_TAG_NAMES = ["Court", "Long"];

// Shared walk ("ballade") listing card, used by the home page and the public ballades list.
export function BalladeCard({ ballade }) {
    const { id, ballade_name, ballade_image, tags, denivele, distance, is_liked, likes_count } = ballade;
    const [like, setLike] = useState({ liked: !!is_liked, count: likes_count ?? 0 });

    const deniveleTag = tags?.find((t) => DENIVELE_TAG_NAMES.includes(t.tag_name));
    const distanceTag = tags?.find((t) => DISTANCE_TAG_NAMES.includes(t.tag_name));

    return (
        <Card component="article">
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img"
                    height="150"
                    loading="lazy"
                    src={`${API_URL}/storage/uploads/ballades/${ballade_image}`}
                    alt={ballade_name}
                />
                <Box sx={{ position: "absolute", top: 6, right: 6, bgcolor: "background.paper", borderRadius: "50%", boxShadow: 1 }}>
                    <LikeButton
                        type="ballades"
                        id={id}
                        liked={like.liked}
                        likesCount={like.count}
                        size="small"
                        onChange={({ liked, likesCount }) => setLike({ liked, count: likesCount })}
                    />
                </Box>
            </Box>
            <CardContent>
                <Typography gutterBottom variant="h6" component="h3" sx={{ mt: 1, mb: 1 }}>
                    {ballade_name}
                </Typography>
                <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Chip
                        size="small"
                        variant="outlined"
                        label={formatDistance(distance) ?? "Distance non renseignée"}
                        title={distanceTag?.tag_name}
                        sx={distanceTag ? { borderColor: distanceTag.color, borderWidth: 2 } : undefined}
                    />
                    <Chip
                        size="small"
                        variant="outlined"
                        label={denivele != null ? `+${denivele} m` : "Dénivelé non renseigné"}
                        title={deniveleTag?.tag_name}
                        sx={deniveleTag ? { borderColor: deniveleTag.color, borderWidth: 2 } : undefined}
                    />
                </Box>
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
                <Button component={Link} to={`/ballades/${id}`} variant="contained" aria-label={`Voir les détails de ${ballade_name}`}>Voir détails</Button>
            </CardActions>
        </Card>
    );
}

export default BalladeCard;
