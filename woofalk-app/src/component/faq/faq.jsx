import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    Link as MuiLink,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const FAQ_SECTIONS = [
    {
        title: "Trouver un lieu ou une balade",
        items: [
            {
                question: "Comment rechercher un lieu ou une balade ?",
                answer: "Utilisez la barre de recherche dans l'en-tête du site, ou rendez-vous sur la page Lieux ou Balades pour filtrer par catégorie, par tag ou par mot-clé (nom, ville, code postal).",
            },
            {
                question: "À quoi correspondent les catégories et les tags affichés sur une fiche ?",
                answer: "La catégorie décrit le type de lieu (parc, restaurant, hébergement, etc.). Les tags précisent des informations pratiques ajoutées par la personne qui a créé la fiche, comme l'accès en laisse ou la présence d'un point d'eau. Vous pouvez combiner plusieurs tags dans les filtres de la page Lieux pour affiner votre recherche.",
            },
            {
                question: "Les lieux et balades sont-ils vérifiés avant d'apparaître sur le site ?",
                answer: "Une fiche créée par un utilisateur connecté est publiée immédiatement, sans relecture préalable. Si une information vous semble incorrecte ou obsolète, signalez-le nous via le formulaire de contact en précisant le nom du lieu ou de la balade concerné.",
            },
        ],
    },
    {
        title: "Proposer un lieu ou une balade",
        items: [
            {
                question: "Dois-je créer un compte pour ajouter un lieu ou une balade ?",
                answer: "Oui. Les boutons d'ajout n'apparaissent que pour les utilisateurs connectés, sur les pages Lieux et Balades. La création d'un compte est gratuite et rapide.",
            },
            {
                question: "Comment ajouter un lieu ou une balade ?",
                answer: "Depuis la page Lieux ou Balades, cliquez sur « Ajouter un lieu » ou « Ajouter une balade », puis renseignez le nom, la catégorie, l'adresse, une description et, si vous le souhaitez, des tags et une photo.",
            },
            {
                question: "Puis-je modifier ou supprimer un lieu ou une balade que j'ai ajouté ?",
                answer: "Pas encore en libre-service depuis votre compte. En attendant, contactez-nous via le formulaire de contact en indiquant la fiche concernée et la modification souhaitée, nous nous en occupons.",
            },
        ],
    },
    {
        title: "Compte et favoris",
        items: [
            {
                question: "Comment ajouter un lieu ou une balade à mes favoris ?",
                answer: "Cliquez sur le cœur affiché sur une fiche ou sa page de détail. Cette action nécessite d'être connecté ; vos favoris sont ensuite listés dans votre espace « Mon compte ».",
            },
            {
                question: "Comment changer mon mot de passe ?",
                answer: "Depuis votre espace « Mon compte », utilisez le bouton « Changer de mot de passe ». Si vous ne parvenez plus à vous connecter, la page de connexion propose un lien « mot de passe oublié ».",
            },
            {
                question: "Que deviennent mes données personnelles ?",
                answer: "Elles ne sont utilisées que pour faire fonctionner le site et ne sont ni revendues ni partagées avec des tiers.",
                linkTo: "/politique-confidentialite",
                linkLabel: "Lire notre politique de confidentialité",
            },
        ],
    },
];

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_SECTIONS.flatMap((section) => section.items).map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
        },
    })),
};

function Faq() {

    document.title = "FAQ - Questions fréquentes";

    return (
        <Container maxWidth="md" id="faq" sx={{ px: { xs: 2, md: 4 }, pt: { xs: "32px", md: "48px" }, pb: "80px" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <Typography variant="h1" sx={{ fontSize: { xs: "24px", md: "30px" } }} gutterBottom>
                Questions fréquentes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: { xs: "28px", md: "36px" } }}>
                Tout ce qu'il faut savoir pour trouver, proposer et partager un lieu ami des chiens sur Woofalk.
            </Typography>

            {FAQ_SECTIONS.map((section, sectionIndex) => (
                <Box key={section.title} component="section" sx={{ marginBottom: { xs: "28px", md: "36px" } }}>
                    <Typography variant="h2" sx={{ fontSize: "20px", marginBottom: "16px" }}>
                        {section.title}
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {section.items.map((item, itemIndex) => {
                            const panelId = `faq-panel-${sectionIndex}-${itemIndex}`;
                            return (
                                <Accordion
                                    key={item.question}
                                    disableGutters
                                    sx={{
                                        boxShadow: "none",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: "16px !important",
                                        overflow: "hidden",
                                        "&:before": { display: "none" },
                                    }}
                                >
                                    {/* MUI Accordion enveloppe déjà AccordionSummary dans un <h3> (slot "heading") : pattern WAI-ARIA correct sans wrapper manuel */}
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls={`${panelId}-content`}
                                        id={`${panelId}-header`}
                                        sx={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: "15px" }}
                                    >
                                        {item.question}
                                    </AccordionSummary>
                                    <AccordionDetails id={`${panelId}-content`} aria-labelledby={`${panelId}-header`}>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.answer}
                                        </Typography>
                                        {item.linkTo ? (
                                            <Typography sx={{ marginTop: "8px" }}>
                                                <MuiLink component={RouterLink} to={item.linkTo}>
                                                    {item.linkLabel}
                                                </MuiLink>
                                            </Typography>
                                        ) : null}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </Box>
                </Box>
            ))}

            <Typography variant="body2" color="text.secondary">
                Vous ne trouvez pas la réponse à votre question ? {" "}
                <MuiLink component={RouterLink} to="/contact">Contactez-nous</MuiLink> depuis notre formulaire de contact.
            </Typography>
        </Container>
    );
}

export default Faq;
