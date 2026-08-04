// Listing "website" fields (place/ballade/hebergement) come straight from
// the API and get rendered as an <a href>. The `pattern` on the create/edit
// forms only checks http(s) at input time — it's client-side only, so it's
// trivially bypassed by calling the API directly or via the CSV importer.
// Re-checking the protocol here, right before it's used as an href, is the
// actual guard against a stored `javascript:`/`data:` URL executing in a
// visitor's browser.
export function isSafeHttpUrl(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return false;
    }

    try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
