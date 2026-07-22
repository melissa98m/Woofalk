import { Box, Typography } from "@mui/material";

// Small "icon dot + value + label" tile used on the place/ballade detail pages
// (distance, elevation, difficulty, etc.)
export function DetailStat({ dotColor = "sageDark", value, label }) {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "16px",
                padding: "12px 18px",
            }}
        >
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: dotColor }} />
            <Box>
                <Typography sx={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "16px", lineHeight: 1.3 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

export default DetailStat;
