import { Box, IconButton, Modal, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Shared chrome for every create/edit/delete/detail modal in the app (place,
// ballade, category, tag, address, user). Positioning/responsive breakpoints
// come from the existing `.modal-crud` rules in assets/css/_App.scss.
export function CrudModal({ open, onClose, title, titleId, children }) {
    return (
        <Modal id="modal-crud-container" hideBackdrop open={open} onClose={onClose} aria-labelledby={titleId}>
            <Box className="modal-crud" sx={{ bgcolor: "background.paper" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <IconButton aria-label="Fermer" color="secondary" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                {title ? (
                    <Typography variant="h4" id={titleId} sx={{ textAlign: "center", mb: 3 }}>
                        {title}
                    </Typography>
                ) : null}
                {children}
            </Box>
        </Modal>
    );
}

export default CrudModal;
