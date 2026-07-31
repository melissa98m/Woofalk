import { Box, Container, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const CONTACT_EMAIL = "bonjour@woofalk.fr";
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Contact depuis les mentions légales — woofalk.fr")}`;

function Section({ title, children }) {
    return (
        <Box component="section" sx={{ marginTop: "28px" }}>
            <Typography variant="h2" sx={{ fontSize: "20px", marginBottom: "10px" }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.7 }}>
                {children}
            </Typography>
        </Box>
    );
}

function MentionsLegales() {

    document.title = "Mentions légales";

    return (
        <Container maxWidth="md" id="mentions-legales" sx={{ px: { xs: 2, md: 4 }, pt: { xs: "32px", md: "48px" }, pb: "80px" }}>
            <Typography variant="h1" sx={{ fontSize: { xs: "26px", md: "32px" } }} gutterBottom>
                Mentions légales
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
                numérique (LCEN), les informations suivantes sont mises à la disposition des utilisateurs et visiteurs du
                site <strong>woofalk.fr</strong>.
            </Typography>

            <Section title="1. Éditeur du site">
                Statut de l'éditeur : [À COMPLÉTER — particulier ou société]<br />
                Nom / raison sociale : [À COMPLÉTER]<br />
                Adresse postale : [À COMPLÉTER]<br />
                Contact : <Link href={MAILTO}>{CONTACT_EMAIL}</Link>
            </Section>

            <Section title="2. Responsable de la publication">
                Le responsable de la publication est : Mélissa Mangione.<br />
                Pour toute question relative au contenu du site, contactez : <Link href={MAILTO}>{CONTACT_EMAIL}</Link>
            </Section>

            <Section title="3. Hébergement">
                Le site est hébergé par : [À COMPLÉTER — nom de l'hébergeur, adresse, contact].
            </Section>

            <Section title="4. Propriété intellectuelle">
                L'ensemble des éléments accessibles sur le site (structure, textes, images, graphismes, logo, icônes) est
                protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou
                partielle, sans autorisation écrite préalable, est interdite et pourrait constituer une contrefaçon au sens
                des articles L.335-2 et suivants du Code de la propriété intellectuelle. Les lieux et balades publiés par les
                utilisateurs restent leur propriété ; en les publiant, ils accordent au site le droit de les afficher
                publiquement dans le cadre du service.
            </Section>

            <Section title="5. Accessibilité du service">
                Le site est accessible 24h/24, 7j/7, sauf interruption programmée ou non pour les besoins de sa maintenance,
                ou en cas de force majeure. L'éditeur ne saurait être tenu responsable des conséquences d'une indisponibilité
                du service.
            </Section>

            <Section title="6. Données personnelles">
                Le traitement des données personnelles des utilisateurs (compte, formulaire de contact, contenu publié) est
                décrit en détail dans notre{" "}
                <Link component={RouterLink} to="/politique-confidentialite">politique de confidentialité</Link>, qui précise
                notamment les données collectées, leurs finalités, leur durée de conservation et les modalités d'exercice de
                vos droits (accès, rectification, effacement, portabilité, etc.).
            </Section>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", marginTop: "32px" }}>
                Dernière mise à jour : 28 juillet 2026.
            </Typography>
        </Container>
    );
}
export default MentionsLegales;
