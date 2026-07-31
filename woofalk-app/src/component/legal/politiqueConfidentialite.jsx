import { Box, Container, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const CONTACT_EMAIL = "bonjour@woofalk.com";

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

function Right({ title, children }) {
    return (
        <Box component="li" sx={{ marginBottom: "10px" }}>
            <strong>{title}</strong> — {children}
        </Box>
    );
}

function PolitiqueConfidentialite() {

    document.title = "Politique de confidentialité";

    return (
        <Container maxWidth="md" id="politique-confidentialite" sx={{ px: { xs: 2, md: 4 }, pt: { xs: "32px", md: "48px" }, pb: "80px" }}>
            <Typography variant="h1" sx={{ fontSize: { xs: "26px", md: "32px" } }} gutterBottom>
                Politique de confidentialité
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Woofalk attache une grande importance à la protection de vos données personnelles. Cette politique
                explique, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et
                Libertés, quelles données nous collectons, pourquoi, combien de temps, et comment exercer vos droits.
            </Typography>

            <Section title="1. Responsable de traitement">
                Le responsable du traitement des données est l'éditeur du site, dont l'identité complète figure dans les{" "}
                <Link component={RouterLink} to="/mentions-legales">mentions légales</Link>. Pour toute question relative à
                vos données personnelles, contactez : <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
            </Section>

            <Section title="2. Données que nous collectons">
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    <Box component="li">
                        <strong>Compte utilisateur</strong> : nom d'utilisateur, adresse email, mot de passe (stocké
                        uniquement sous forme hachée, jamais en clair).
                    </Box>
                    <Box component="li">
                        <strong>Formulaire de contact</strong> : nom, email, sujet et contenu du message.
                    </Box>
                    <Box component="li">
                        <strong>Contenu que vous publiez</strong> : lieux et balades que vous créez (nom, description,
                        photo, adresse, coordonnées GPS).
                    </Box>
                    <Box component="li">
                        <strong>Interactions</strong> : les lieux et balades que vous "aimez" (likes).
                    </Box>
                </Box>
                Nous ne collectons aucune donnée bancaire ni aucune donnée sensible au sens de l'article 9 du RGPD.
            </Section>

            <Section title="3. Pourquoi nous les utilisons (finalités et base légale)">
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    <Box component="li">
                        <strong>Création et gestion de votre compte</strong> : exécution du contrat qui nous lie (fournir le
                        service que vous demandez), sur la base de votre consentement explicite recueilli à l'inscription.
                    </Box>
                    <Box component="li">
                        <strong>Réponse à vos messages de contact</strong> : intérêt légitime à répondre aux demandes qui
                        nous sont adressées / mesures précontractuelles.
                    </Box>
                    <Box component="li">
                        <strong>Affichage des lieux et balades que vous publiez</strong> : exécution du contrat — c'est
                        l'objet même du service.
                    </Box>
                    <Box component="li">
                        <strong>Sécurité du site</strong> (limitation du nombre de requêtes par adresse IP) : intérêt
                        légitime à prévenir les abus, sans conservation de l'adresse IP au-delà de cet usage technique.
                    </Box>
                </Box>
            </Section>

            <Section title="4. À qui vos données sont-elles transmises ?">
                Vos données ne sont ni vendues, ni louées, ni partagées avec des tiers à des fins commerciales. Elles ne sont
                accessibles qu'à l'équipe technique du site et, le cas échéant, à notre hébergeur, qui n'y accède que dans le
                cadre strict de la maintenance technique de l'infrastructure.
            </Section>

            <Section title="5. Combien de temps conservons-nous vos données ?">
                <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    <Box component="li">
                        <strong>Compte utilisateur</strong> : tant que votre compte existe. Vous pouvez le supprimer à tout
                        moment (voir section 7).
                    </Box>
                    <Box component="li">
                        <strong>Messages de contact</strong> : ces messages ne sont pas rattachés techniquement à un compte ;
                        ils sont conservés 3 ans à compter du dernier échange, ou supprimés avant ce délai sur simple demande
                        à <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
                    </Box>
                    <Box component="li">
                        <strong>Lieux et balades publiés</strong> : conservés tant qu'ils restent utiles au service ; en cas
                        de suppression de votre compte, ils restent visibles mais sont anonymisés (voir section 7).
                    </Box>
                </Box>
            </Section>

            <Section title="6. Cookies et traceurs">
                Le site ne dépose aucun cookie de mesure d'audience ni de publicité. La connexion à votre compte repose sur
                un jeton technique stocké dans le stockage local (localStorage) de votre navigateur, et non sur un cookie —
                il n'est transmis qu'à notre propre API et sert uniquement à vous maintenir connecté. Le site charge les
                polices de caractères (Google Fonts) depuis les serveurs de Google, ce qui transmet votre adresse IP à
                Google au moment du chargement de la page ; aucune autre donnée n'est partagée dans ce cadre.
            </Section>

            <Section title="7. Vos droits">
                Conformément aux articles 15 à 21 du RGPD, vous disposez des droits suivants sur vos données :
                <Box component="ul" sx={{ pl: 3, m: 0, mt: 1 }}>
                    <Right title="Droit d'accès et de portabilité">
                        téléchargez à tout moment une copie de vos données depuis la page{" "}
                        <Link component={RouterLink} to="/mon-compte">Mon compte</Link> ("Télécharger mes données").
                    </Right>
                    <Right title="Droit à l'effacement">
                        supprimez votre compte à tout moment depuis la page{" "}
                        <Link component={RouterLink} to="/mon-compte">Mon compte</Link> ("Supprimer mon compte"). Votre
                        compte, votre email et vos favoris sont alors définitivement supprimés ; les lieux et balades que
                        vous avez créés restent publics mais sont anonymisés.
                    </Right>
                    <Right title="Droit de rectification">
                        contactez-nous à <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> pour corriger une
                        information vous concernant.
                    </Right>
                    <Right title="Droit d'opposition et de limitation">
                        contactez-nous à la même adresse pour vous opposer à un traitement ou en demander la limitation.
                    </Right>
                </Box>
                Nous répondons à toute demande dans un délai maximum d'un mois.
            </Section>

            <Section title="8. Sécurité">
                Nous mettons en œuvre des mesures techniques raisonnables (mots de passe hachés, connexions authentifiées
                par jeton, limitation du nombre de requêtes) pour protéger vos données contre l'accès non autorisé, la perte
                ou l'altération.
            </Section>

            <Section title="9. Réclamation">
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la
                Commission Nationale de l'Informatique et des Libertés (CNIL) : 3 Place de Fontenoy — TSA 80715, 75334 Paris
                Cedex 07, <Link href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</Link>.
            </Section>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", marginTop: "32px" }}>
                Dernière mise à jour : 28 juillet 2026.
            </Typography>
        </Container>
    );
}
export default PolitiqueConfidentialite;
