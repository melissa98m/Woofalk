import React, {useEffect, Suspense, lazy} from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import './index.css';
import './assets/css/component/_partials/_theme.scss';

import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {useTheme, useMediaQuery} from "@mui/material";

import {lightTheme} from "./component/_partials/_theme/_lightTheme";
import {darkTheme} from "./component/_partials/_theme/_darkTheme";
import {ColorContext, setThemeToStorage} from "./component/_partials/_theme/_colorContext";
import {createTheme, CssBaseline, ThemeProvider , Button, Box, CircularProgress} from "@mui/material";

import App from './App';
// Home reste en import direct : c'est la page d'atterrissage la plus visitée et le
// fallback utilisé inline par plusieurs routes ci-dessous (auth requise/déjà connecté).
import Home from "./component/home/home";
// Le reste des pages passe par React.lazy : sans ça, un visiteur qui arrive sur "/"
// téléchargeait aussi le code de l'admin, des cartes Leaflet, des formulaires, etc.
// avant même de voir la home — c'était une grosse partie de la lenteur au chargement.
const Contact = lazy(() => import("./component/contact/contact"));
const ContactMessages = lazy(() => import("./component/contact/contactMessages"));
const Category = lazy(() => import("./component/category/category"));
const Places = lazy(() => import("./component/place/places"));
const Place = lazy(() => import("./component/place/place"));
const PlaceDetail = lazy(() => import("./component/place/placeDetail"));
const NewPlace = lazy(() => import("./component/place/newPlace"));
const SearchResults = lazy(() => import("./component/search/searchResults"));
const Ballades = lazy(() => import("./component/ballade/ballades"));
const Ballade = lazy(() => import("./component/ballade/ballade"));
const BalladeDetail = lazy(() => import("./component/ballade/balladeDetail"));
const NewBallade = lazy(() => import("./component/ballade/newBallade"));
const Address = lazy(() => import("./component/address/address"));
const Tag = lazy(() => import("./component/tag/tag"));
const User = lazy(() => import("./component/user/user"));
const Dashboard = lazy(() => import("./component/dashboard/dashboard"));
const Export = lazy(() => import("./component/export/export"));
const AdminLayout = lazy(() => import("./component/_partials/_admin/AdminLayout"));
import {ScrollToTop} from "./component/_partials/ScrollToTop";
import {Navbar} from "./component/_partials/_navbar/_navbar";
import {Footer} from "./component/_partials/_footer/_footer";
const Login = lazy(() => import("./services/auth/login"));
const Logout = lazy(() => import("./services/auth/logout"));
const Register = lazy(() => import("./services/auth/register"));
const ForgotPassword = lazy(() => import("./services/auth/forgotPassword"));
const ResetPassword = lazy(() => import('.//services/auth/resetPassword'));
const Account = lazy(() => import("./component/account/account"));
const ChangePassword = lazy(() => import("./component/account/changePassword"));
const MentionsLegales = lazy(() => import("./component/legal/mentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("./component/legal/politiqueConfidentialite"));
const Faq = lazy(() => import("./component/faq/faq"));

import auth from "./services/auth/token"

function CustomTheme() {

    const [mode, setMode] = React.useState("light");
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) =>
                    prevMode === "light" ? "dark" : "light"
                );
                setThemeToStorage();
            },
        }),
        []
    );
    const theme = React.useMemo(
        () => createTheme(mode === "light" ? lightTheme : darkTheme),
        [mode]
    );
    const ecran = useTheme();
    const isMobile = useMediaQuery(ecran.breakpoints.down("sm"));

    useEffect(() => {
        // rend le thème persistant après reload
        const mode = localStorage.getItem("isDarkMode");
        if (mode) {
            setMode(mode);
        }
    }, []);
    return <ColorContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme/>
            <BrowserRouter>
                <ScrollToTop/>
                <Navbar/>
                {isMobile ? null : (
                 <Button id="back"
                 variant="outlined" color="secondary"
                                  onClick={() => {
                                    window.history.back();
                                  }}
                                >
                                 Retour
                                </Button>
                 )}
                <App/>
                <Suspense fallback={
                    <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                        <CircularProgress color="secondary" aria-label="Chargement de la page" />
                    </Box>
                }>
                <Routes>
                    <Route exact path="/" element={<Home/>}>Accueil</Route>
                    <Route exact path="login" element={auth.getToken() ? <Home adminMessage='alreadyLogged'/> : <Login/> }>Login</Route>
                    <Route exact path="forgot-password" element={auth.getToken() ? <Home adminMessage='alreadyLogged'/> :<ForgotPassword/>}>Mot de passe oublié</Route>
                    <Route exact path="reset-password/:token" element={<ResetPassword/>}>ResetPassword</Route>
                    <Route exact path="register" element={<Register/>}>Inscription</Route>
                    <Route exact path="places" element={<Places/>}>Places</Route>
                    <Route exact path="places/new" element={auth.loggedAndUser() || auth.loggedAndAdmin() ? <NewPlace/> : <Home adminMessage='Non connecté'/>}>NewPlace</Route>
                    <Route exact path="places/:id" element={<PlaceDetail/>}>PlaceDetail</Route>
                    <Route exact path="ballades" element={<Ballades/>}>Ballades</Route>
                    <Route exact path="ballades/new" element={auth.loggedAndUser() || auth.loggedAndAdmin() ? <NewBallade/> : <Home adminMessage='Non connecté'/>}>NewBallade</Route>
                    <Route exact path="ballades/:id" element={<BalladeDetail/>}>BalladeDetail</Route>
                    <Route exact path="recherche" element={<SearchResults/>}>Recherche</Route>
                    <Route exact path="logout" element={<Logout/>}>Logout</Route>
                    <Route element={auth.loggedAndAdmin() ? <AdminLayout/> : <Home adminMessage='unauthorizedRole'/>}>
                        <Route exact path="address" element={<Address/>}>Address</Route>
                        <Route exact path="place" element={<Place/>}>Place</Route>
                        <Route exact path="ballade" element={<Ballade/>}>Ballade</Route>
                        <Route exact path="category" element={<Category/>}>Categorie</Route>
                        <Route exact path="tag" element={<Tag/>}>Tag</Route>
                        <Route exact path="user" element={<User/>}>User</Route>
                        <Route exact path="contact-messages" element={<ContactMessages/>}>ContactMessages</Route>
                        <Route exact path="dashboard" element={<Dashboard/>}>Dashboard</Route>
                        <Route exact path="export" element={<Export/>}>Export</Route>
                    </Route>
                    <Route exact path="mon-compte" element={auth.loggedAndUser() || auth.loggedAndAdmin() ? <Account/> : <Home adminMessage='Non connecté'/> }>Account</Route>
                    <Route exact path="change-password" element={auth.loggedAndUser() || auth.loggedAndAdmin() ? <ChangePassword/> : <Home adminMessage='Non connecté'/> }>Change Password</Route>
                    <Route exact path="contact" element={<Contact/>}>Contact</Route>
                    <Route exact path="faq" element={<Faq/>}>FAQ</Route>
                    <Route exact path="mentions-legales" element={<MentionsLegales/>}>MentionsLegales</Route>
                    <Route exact path="politique-confidentialite" element={<PolitiqueConfidentialite/>}>PolitiqueConfidentialite</Route>
                    <Route path="*" element={
                           <div class="container">
                           <h1>Erreur 404</h1>
                            <div class="boo-wrapper">
                                <div class="boo">
                                <div class="face"></div>
                                </div>
                            <div class="shadow"></div>
                            <h2>Oops!</h2>
                             <p>La page demandée n'a pas été trouvée <br/></p>
                             <Button variant="outlined" color="secondary" sx={{ textAlign: "center"}}href="/">Retourner sur l'accueil</Button>
                         </div>
                        </div>

                    }/>
                </Routes>
                </Suspense>
                <Footer />
            </BrowserRouter>
        </ThemeProvider>
    </ColorContext.Provider>
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <CustomTheme/>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
