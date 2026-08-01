import { SITE_URL } from "../../../config";

// Builds a schema.org BreadcrumbList matching the visual <Breadcrumbs> already
// shown on detail pages (PlaceDetail, BalladeDetail, HebergementDetail).
// `items` is an ordered list of { name, path }, path relative to SITE_URL.
export function breadcrumbJsonLd(items) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map(({ name, path }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            item: `${SITE_URL}${path}`,
        })),
    };
}
