import { Chip } from "@mui/material";

const LABELS = {
    publie: "Publié",
    en_attente: "En attente",
};

// Renders the moderation status stored on places/ballades as a pill chip,
// matching the mockup's sage (published) / terracotta (pending) treatment.
export function StatusChip({ status }) {
    const isPending = status === "en_attente";
    return (
        <Chip
            size="small"
            label={LABELS[status] ?? status}
            sx={{
                bgcolor: isPending ? "terracottaSoft" : "sageSoft",
                color: isPending ? "terracottaDark" : "sageDark",
            }}
        />
    );
}

export default StatusChip;
