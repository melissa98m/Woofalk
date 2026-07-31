import { Box, Button } from "@mui/material";

// Text-style row action ("Modifier" / "Supprimer"), matching the mockup's
// adminActionStyle/adminActionDangerStyle — sage for edit, coral for danger,
// no background, used in every admin table row instead of a filled icon button.
// Row actions (Edit/Delete/Reply, always called with `icon`) collapse to
// icon-only below the `lg` breakpoint so the Actions column stays compact on
// phones/tablets; the label is still exposed via aria-label so the button
// keeps an accessible name once the visible text is hidden. Bulk-bar actions
// (Publier, Supprimer la sélection…) don't pass an icon and always keep
// their full label — there'd be nothing to fall back to otherwise.
export function RowActionButton({ icon, danger, children, sx, "aria-label": ariaLabel, ...props }) {
    const fallbackLabel = typeof children === "string" ? children : undefined;

    return (
        <Button
            variant="text"
            size="small"
            startIcon={icon}
            aria-label={icon ? (ariaLabel ?? fallbackLabel) : ariaLabel}
            sx={{
                color: danger ? "coral" : "sageDark",
                fontWeight: 700,
                fontSize: "13px",
                textTransform: "none",
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                ...(icon ? {
                    minWidth: { xs: "40px", lg: 0 },
                    minHeight: { xs: "40px", lg: "auto" },
                    px: "8px",
                    "& .MuiButton-startIcon": {
                        marginRight: { xs: 0, lg: "4px" },
                        marginLeft: { xs: 0, lg: "-2px" },
                    },
                } : { minWidth: 0 }),
                ...sx,
            }}
            {...props}
        >
            {icon ? (
                <Box component="span" sx={{ display: { xs: "none", lg: "inline" } }}>{children}</Box>
            ) : children}
        </Button>
    );
}

export default RowActionButton;
