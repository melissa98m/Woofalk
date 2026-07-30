import { Box, useMediaQuery, useTheme } from "@mui/material";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PushPinIcon from "@mui/icons-material/PushPin";
import ApprovalIcon from "@mui/icons-material/Approval";
import HotelOutlinedIcon from "@mui/icons-material/HotelOutlined";
import CategoryIcon from "@mui/icons-material/Category";
import TagIcon from "@mui/icons-material/Tag";
import PersonIcon from "@mui/icons-material/Person";
import MailIcon from "@mui/icons-material/MailOutlined";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Logo from "../../../assets/logo.png";

const NAV_ITEMS = [
    { to: "/admin/dashboard", label: "Tableau de bord", icon: DashboardIcon },
    { to: "/admin/place", label: "Lieux", icon: PushPinIcon },
    { to: "/admin/ballade", label: "Balades", icon: ApprovalIcon },
    { to: "/admin/hebergement", label: "Hébergements", icon: HotelOutlinedIcon },
    { to: "/admin/category", label: "Catégories", icon: CategoryIcon },
    { to: "/admin/tag", label: "Tags", icon: TagIcon },
    { to: "/admin/user", label: "Utilisateurs", icon: PersonIcon },
    { to: "/admin/contact-messages", label: "Messages", icon: MailIcon },
    { to: "/admin/export", label: "Export", icon: CloudDownloadIcon },
];

// Persistent sidebar shell for the admin area (dashboard + resource CRUD
// pages), replacing the ad hoc 2-column grid that used to live inside
// dashboard.jsx alone. Collapses to a horizontal top bar on small screens.
export function AdminLayout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const location = useLocation();

    const focusRing = {
        outline: "none",
        boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.terracottaDark}`,
    };

    return (
        <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "70vh" }}>
            <Box
                component="nav"
                aria-label="Navigation administration"
                sx={{
                    width: isMobile ? "100%" : "220px",
                    flexShrink: 0,
                    bgcolor: "background.alt",
                    borderRight: isMobile ? "none" : "1px solid",
                    borderBottom: isMobile ? "1px solid" : "none",
                    borderColor: "divider",
                    p: "18px",
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    flexWrap: "wrap",
                    gap: "4px",
                }}
            >
                {!isMobile && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Box component="img" src={Logo} alt="Go with dog" sx={{ height: 40 }} />
                    </Box>
                )}
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                    const isActive = location.pathname === to;
                    return (
                        <Box
                            key={to}
                            component={NavLink}
                            to={to}
                            end
                            aria-current={isActive ? "page" : undefined}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                textDecoration: "none",
                                fontFamily: "'Nunito', sans-serif",
                                fontWeight: 700,
                                fontSize: "14px",
                                padding: "10px 14px",
                                borderRadius: "12px",
                                bgcolor: isActive ? "terracottaSoft" : "transparent",
                                color: isActive ? "terracottaDark" : "text.secondary",
                                "&:focus-visible": focusRing,
                            }}
                        >
                            <Icon fontSize="small" />
                            {label}
                        </Box>
                    );
                })}
            </Box>
            <Box component="main" sx={{ flex: 1, minWidth: 0, p: isMobile ? "20px" : "32px 40px" }}>
                <Outlet />
            </Box>
        </Box>
    );
}

export default AdminLayout;
