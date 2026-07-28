import { Box, Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";

// Shared walk ("ballade") listing card, used by the home page and the public ballades list.
export function BalladeCard({ ballade }) {
    const { id, ballade_name, ballade_image, tags, denivele, distance } = ballade;

    return (
        <Card component="article">
            <CardMedia
                component="img"
                height="150"
                src={`${API_URL}/storage/uploads/ballades/${ballade_image}`}
                alt={ballade_name}
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="h3" sx={{ mt: 1, mb: 1 }}>
                    {ballade_name}
                </Typography>
                <Box sx={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Chip size="small" variant="outlined" label={`${distance} km`} />
                    <Chip size="small" variant="outlined" label={`+${denivele} m`} />
                </Box>
                {tags && tags.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px", mt: 1.5 }}>
                        {tags.map((t) => (
                            <Chip key={t.id} size="small" variant="outlined" label={`#${t.tag_name}`} />
                        ))}
                    </Box>
                ) : null}
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button component={Link} to={`/ballades/${id}`} variant="contained">Voir détails</Button>
            </CardActions>
        </Card>
    );
}

export default BalladeCard;
