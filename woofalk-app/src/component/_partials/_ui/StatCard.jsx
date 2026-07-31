import { Box, Typography } from "@mui/material";

// A single tile in the admin dashboard's stat row.
export function StatCard({ label, value }) {
    return (
        <Box
            component="dl"
            sx={{
                m: 0,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "14px",
                p: "18px",
            }}
        >
            <Typography component="dt" variant="body2" sx={{ fontWeight: 700, color: "text.secondary", mb: 1 }}>
                {label}
            </Typography>
            <Typography component="dd" variant="h4" sx={{ m: 0 }}>
                {value}
            </Typography>
        </Box>
    );
}

export default StatCard;
