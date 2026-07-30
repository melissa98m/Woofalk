import { Button } from "@mui/material";

// Text-style row action ("Modifier" / "Supprimer"), matching the mockup's
// adminActionStyle/adminActionDangerStyle — sage for edit, coral for danger,
// no background, used in every admin table row instead of a filled icon button.
export function RowActionButton({ icon, danger, children, sx, ...props }) {
    return (
        <Button
            variant="text"
            size="small"
            startIcon={icon}
            sx={{
                color: danger ? "coral" : "sageDark",
                fontWeight: 700,
                fontSize: "13px",
                minWidth: 0,
                textTransform: "none",
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                ...sx,
            }}
            {...props}
        >
            {children}
        </Button>
    );
}

export default RowActionButton;
