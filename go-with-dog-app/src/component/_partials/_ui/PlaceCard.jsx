import { Button, Card, CardActions, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { API_URL } from "../../../config";

// Shared place listing card, used by the home page and the public places list.
export function PlaceCard({ place }) {
    const { id, place_name, place_image, category, address } = place;

    return (
        <Card component="article">
            <CardMedia
                component="img"
                height="150"
                src={`${API_URL}/storage/uploads/places/${place_image}`}
                alt={place_name}
            />
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
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button component={Link} to={`/places/${id}`} variant="contained">Voir détails</Button>
            </CardActions>
        </Card>
    );
}

export default PlaceCard;
