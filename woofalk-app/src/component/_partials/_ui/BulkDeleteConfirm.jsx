import { Box, Button, FormControl } from "@mui/material";
import { CrudModal } from "./CrudModal";

// Shared confirm dialog for every admin table's "supprimer la sélection"
// action — bulk delete is destructive and irreversible, so it always asks
// first, same as the per-row delete modals.
export function BulkDeleteConfirm({ open, onClose, count, itemLabel, itemLabelPlural, onConfirm }) {
    const plural = itemLabelPlural ?? `${itemLabel}s`;
    const label = count > 1 ? plural : itemLabel;
    return (
        <CrudModal open={open} onClose={onClose} title={`Supprimer ${count} ${label} ?`} titleId="bulk-delete-title">
            <FormControl>
                <Box>
                    Cette action est irréversible. Voulez-vous vraiment supprimer les {count} {label} sélectionné{count > 1 ? "s" : ""} ?
                </Box>
                <Box className="action-button">
                    <Button sx={{ m: 3 }} variant="contained" color="error" onClick={onConfirm}>Supprimer</Button>
                </Box>
            </FormControl>
        </CrudModal>
    );
}

export default BulkDeleteConfirm;
