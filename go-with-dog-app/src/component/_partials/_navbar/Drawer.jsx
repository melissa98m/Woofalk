import { useState } from "react";
import { Drawer, Box, Divider } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import auth from "../../../services/auth/token";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import { LogginButton } from "../../../services/auth/logginButton";
import { SwitchModeButton } from "../_theme/_switchModeButton";
import Search from "../../search/search";
import CloseIcon from "@mui/icons-material/Close";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ApprovalIcon from "@mui/icons-material/Approval";
import PushPinIcon from "@mui/icons-material/PushPin";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ContactsIcon from "@mui/icons-material/Contacts";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

const LINKS = [
    { to: "/", label: "Accueil", icon: HomeOutlinedIcon },
    { to: "/places", label: "Places", icon: PushPinIcon },
    { to: "/ballades", label: "Ballades", icon: ApprovalIcon },
];

function DrawerComponent() {
    const [openDrawer, setOpenDrawer] = useState(false);
    const location = useLocation();
    const close = () => setOpenDrawer(false);

    const linkSx = (to) => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        fontSize: "15px",
        padding: "12px 14px",
        borderRadius: "12px",
        bgcolor: location.pathname === to ? "terracottaSoft" : "transparent",
        color: location.pathname === to ? "terracottaDark" : "text.primary",
    });

    return (
        <>
            <Drawer
                open={openDrawer}
                onClose={close}
                PaperProps={{ sx: { width: "min(80%, 320px)", padding: "12px" } }}
            >
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                    <IconButton aria-label="Fermer le menu" color="secondary" onClick={close} sx={{ minWidth: "44px", minHeight: "44px" }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ mb: 2 }}>
                    <Search label="Recherche" />
                </Box>
                <Box component="nav" aria-label="Navigation principale" sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {LINKS.map(({ to, label, icon: Icon }) => (
                        <Box key={to} component={Link} to={to} onClick={close} sx={linkSx(to)}>
                            <Icon fontSize="medium" />
                            {label}
                        </Box>
                    ))}
                    {auth.loggedAndAdmin() ? (
                        <Box component={Link} to="/dashboard" onClick={close} sx={linkSx("/dashboard")}>
                            <DashboardIcon fontSize="medium" />
                            Dashboard
                        </Box>
                    ) : null}
                    <Box component={Link} to="/contact" onClick={close} sx={linkSx("/contact")}>
                        <ContactsIcon fontSize="medium" />
                        Contact
                    </Box>
                    {auth.loggedAndUser() || auth.loggedAndAdmin() ? (
                        <Box component={Link} to="/mon-compte" onClick={close} sx={linkSx("/mon-compte")}>
                            <AccountCircleOutlinedIcon fontSize="medium" />
                            Mon compte
                        </Box>
                    ) : null}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                    <LogginButton />
                    <SwitchModeButton />
                </Box>
            </Drawer>
            <IconButton aria-label="Ouvrir le menu" onClick={() => setOpenDrawer(true)} sx={{ minWidth: "44px", minHeight: "44px" }}>
                <MenuIcon />
            </IconButton>
        </>
    );
}
export default DrawerComponent;
