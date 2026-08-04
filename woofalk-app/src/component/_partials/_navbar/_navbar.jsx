import { AppBar, Box, Button, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { SwitchModeButton } from "../_theme/_switchModeButton";
import "../../../assets/css/component/_partials/_navbar.scss";
import { LogginButton } from "../../../services/auth/logginButton";
import auth from "../../../services/auth/token";
import Logo from "../../../assets/logo.png";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import Search from "../../search/search";
import DrawerComponent from "./Drawer";

const NAV_LINKS = [
    { to: "/", label: "Accueil" },
    { to: "/places", label: "Lieux" },
    { to: "/ballades", label: "Ballades" },
    { to: "/hebergements", label: "Hébergements" },
    { to: "/carte", label: "Carte" },
];

export function Navbar() {
    const theme = useTheme();
    // "lg" (1200px) plutôt que "md" : en dessous, recherche + liens + actions
    // (jusqu'à 8 éléments) ne tiennent pas sur une ligne et retombent en wrap
    // désordonné (~900-1150px) — le drawer est plus propre sur cette plage.
    const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
    const location = useLocation();

    const navButtonSx = (to) => ({
        bgcolor: location.pathname === to ? "terracottaSoft" : "transparent",
        color: location.pathname === to ? "terracottaDark" : "text.primary",
    });

    return (
        <AppBar
            className="header"
            id="navbar"
            position="sticky"
            elevation={0}
            sx={{
                top: 0,
                bgcolor: "background.paper",
                color: "text.primary",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    // AppBar est en flex-row et ne stretch pas ses enfants : sans
                    // width 100%, cette grille ne prenait que la largeur de son
                    // contenu (flex-grow: 0), d'où un rendu incohérent selon la
                    // largeur d'écran plutôt que de remplir la barre.
                    width: "100%",
                    // Logo/nav en "auto" (juste leur contenu) et recherche en 1fr :
                    // avec 2 colonnes "1fr" symétriques, la colonne des liens était
                    // bridée à la largeur (minuscule) de la colonne du logo, donc les
                    // liens wrappaient sur 2 lignes jusqu'à ~1800px (surtout admin :
                    // Dashboard + compte + déconnexion + thème en plus).
                    gridTemplateColumns: "auto minmax(0, 1fr) auto",
                    alignItems: "center",
                    columnGap: "16px",
                    rowGap: "8px",
                    padding: "10px 24px",
                }}
            >
                <Box component={Link} to="/" aria-label="Accueil Woofalk" sx={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, justifySelf: "start", textDecoration: "none" }}>
                    <Box component="img" alt="Woofalk" src={Logo} id="logo" width={56} height={56} />
                    <Typography
                        component="span"
                        sx={{
                            fontFamily: "'Fredoka', sans-serif",
                            fontWeight: 600,
                            fontSize: { xs: "1.15rem", sm: "1.4rem" },
                            color: "terracottaDark",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Woofalk
                    </Typography>
                </Box>

                {isMobile ? (
                    <>
                    <Box />
                    <Box sx={{ display: "flex", alignItems: "center", justifySelf: "end" }}>
                        <DrawerComponent />
                    </Box>
                    </>
                ) : (
                    <>
                    <Box sx={{ justifySelf: "center", width: "280px", maxWidth: "100%" }}>
                        <Search />
                    </Box>
                    <Box className="navbar" sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifySelf: "end" }}>
                        {NAV_LINKS.map(({ to, label }) => (
                            <Button key={to} component={Link} to={to} sx={navButtonSx(to)}>
                                {label}
                            </Button>
                        ))}
                        {auth.loggedAndAdmin() ? (
                            <Button component={Link} to="/admin/dashboard" sx={navButtonSx("/admin/dashboard")}>
                                Dashboard
                            </Button>
                        ) : auth.loggedAndModerator() ? (
                            <Button component={Link} to="/admin/place" sx={navButtonSx("/admin/place")}>
                                Modération
                            </Button>
                        ) : null}
                        <Button component={Link} to="/contact" sx={navButtonSx("/contact")}>
                            Contact
                        </Button>
                        {auth.loggedAndUser() || auth.loggedAndCanModerate() ? (
                            <Button component={Link} to="/mon-compte" aria-label="Mon compte" sx={navButtonSx("/mon-compte")}>
                                <AccountCircleOutlinedIcon />
                            </Button>
                        ) : null}
                        <LogginButton />
                        <SwitchModeButton />
                    </Box>
                    </>
                )}
            </Box>
        </AppBar>
    );
}
