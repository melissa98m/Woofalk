// Picks black or white text for readability against an arbitrary hex background (WCAG-ish relative luminance).
export function getReadableTextColor(hexColor) {
    const hex = (hexColor ?? "").replace("#", "");
    if (![3, 6].includes(hex.length)) {
        return "#000000";
    }
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) {
        return "#000000";
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#000000" : "#ffffff";
}
