import { Box, Typography } from "@mui/material";
import { RowActionButton } from "./RowActionButton";

// Toolbar shown above an admin table once at least one row is selected:
// "N sélectionné(s)" + "tout sélectionner" / "désélectionner tout" + the
// resource-specific bulk actions (publish/pending/delete) passed as children.
export function BulkActionsBar({ count, total, onSelectAll, onClear, children }) {
    if (count === 0) return null;

    return (
        <Box
            role="toolbar"
            aria-label="Actions groupées"
            sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                px: "20px",
                py: "12px",
                bgcolor: "sageSoft",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Typography sx={{ fontWeight: 700, fontSize: "13px", color: "sageDark", whiteSpace: "nowrap" }}>
                {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
            </Typography>
            {count < total ? (
                <RowActionButton onClick={onSelectAll}>Tout sélectionner ({total})</RowActionButton>
            ) : null}
            <RowActionButton onClick={onClear}>Désélectionner tout</RowActionButton>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", ml: "auto" }}>
                {children}
            </Box>
        </Box>
    );
}

export default BulkActionsBar;
