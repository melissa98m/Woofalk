// Cuts an arbitrary label down to a fixed on-screen length, appending an
// ellipsis — tag names are free text (including scraped ones, some 50+
// characters long) and would otherwise overflow the fixed pill shape of a Chip.
export function truncateLabel(text, maxLength = 35) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export default truncateLabel;
