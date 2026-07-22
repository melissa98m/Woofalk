import { AppBar, Box, Button, useTheme, useMediaQuery } from "@mui/material";
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
    { to: "/places", label: "Places" },
    { to: "/ballades", label: "Ballades" },
];

export function Navbar() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
                    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                    alignItems: "center",
                    columnGap: "16px",
                    rowGap: "8px",
                    padding: "10px 24px",
                }}
            >
                <Box component={Link} to="/" aria-label="Accueil Go with dog" sx={{ display: "flex", alignItems: "center", flexShrink: 0, justifySelf: "start" }}>
                    <Box component="img" alt="Go with dog" src={Logo} id="logo" />
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
                            <Button component={Link} to="/dashboard" sx={navButtonSx("/dashboard")}>
                                Dashboard
                            </Button>
                        ) : null}
                        <Button component={Link} to="/contact" sx={navButtonSx("/contact")}>
                            Contact
                        </Button>
                        {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
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
