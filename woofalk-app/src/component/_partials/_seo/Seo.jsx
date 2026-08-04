import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router";
import { SITE_URL } from "../../../config";

const SITE_NAME = "Woofalk";
const DEFAULT_IMAGE = `${SITE_URL}/logo512.png`;

// Per-page <head> tags (title, description, canonical, Open Graph, Twitter
// Card, JSON-LD) — index.html only carries generic fallback tags since this
// is a client-rendered SPA with no per-route HTML. Canonical/OG url are
// derived from the current route so callers never pass a URL by hand.
const META_DESCRIPTION_MAX_LENGTH = 160;

// Search engines truncate meta descriptions themselves, but user-generated
// content (a place's/ballade's free-text description) can run to several
// paragraphs — trim it to a reasonable length before it lands in <head>.
export function truncateDescription(text) {
    if (!text || text.length <= META_DESCRIPTION_MAX_LENGTH) {
        return text;
    }

    return `${text.slice(0, META_DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}

export function Seo({ title, description, image = DEFAULT_IMAGE, type = "website", noindex = false, jsonLd }) {
    const { pathname } = useLocation();
    const url = `${SITE_URL}${pathname}`;
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {description ? <meta name="description" content={description} /> : null}
            <link rel="canonical" href={url} />
            <meta name="robots" content={noindex ? "noindex, follow" : "index, follow"} />

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={fullTitle} />
            {description ? <meta property="og:description" content={description} /> : null}
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            {description ? <meta name="twitter:description" content={description} /> : null}
            <meta name="twitter:image" content={image} />

            {schemas.map((schema, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
}

export default Seo;
