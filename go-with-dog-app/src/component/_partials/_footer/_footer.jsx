import { Box, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const FOOTER_LINKS = [
    { to: "/", label: "Accueil" },
    { to: "/places", label: "Lieux" },
    { to: "/ballades", label: "Balades" },
    { to: "/contact", label: "Contact" },
    { to: "/mentions-legales", label: "Mentions légales" },
    { to: "/politique-confidentialite", label: "Politique de confidentialité" },
];

export function Footer() {
    return (
        <Box
            component="footer"
            id="footer"
            sx={{
                bgcolor: "background.alt",
                borderTop: "1px solid",
                borderColor: "divider",
                padding: "28px 6vw",
                textAlign: "center",
            }}
        >
            <Box
                component="nav"
                aria-label="Liens du pied de page"
                sx={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginBottom: "12px" }}
            >
                {FOOTER_LINKS.map(({ to, label }) => (
                    <Link
                        key={to}
                        component={RouterLink}
                        to={to}
                        color="text.secondary"
                        underline="hover"
                        sx={{ fontSize: "13px", fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}
                    >
                        {label}
                    </Link>
                ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
                © {new Date().getFullYear()} Go with dog — Trouver un lieu ami des chiens, partout en France.
            </Typography>
        </Box>
    );
}
