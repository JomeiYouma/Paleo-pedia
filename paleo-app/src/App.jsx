import React, { useEffect } from 'react';
import {
  createHashRouter,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  Route,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { getHostSubsiteSlug } from './utils/subsiteHost';
import { AppProvider, useApp } from './context/AppContext';
import Toast from './components/Toast';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import ManageCartels from './pages/ManageCartels';
import AdminSettings from './pages/AdminSettings';
import AdminPartners from './pages/AdminPartners';
import AdminTeam from './pages/AdminTeam';
import AdminTeamContent from './pages/AdminTeamContent';
import AdminPress from './pages/AdminPress';
import AdminMissions from './pages/AdminMissions';
import AdminPrestations from './pages/AdminPrestations';
import AdminShop from './pages/AdminShop';
import AdminCategoriesWorkshops from './pages/AdminCategoriesWorkshops';
import AdminLogs from './pages/AdminLogs';
import AdminStats from './pages/AdminStats';
import Presentation from './pages/Presentation';
import Prestations from './pages/Prestations';
import Ouvrages from './pages/Ouvrages';
import Museum from './pages/Museum';
import Contact from './pages/Contact';
import Participer from './pages/Participer';
import Presse from './pages/Presse';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import LegalNotices from './pages/LegalNotices';
import SiteLayout from './components/SiteLayout';
import SubsiteLayout from './layouts/SubsiteLayout';
import SubsiteHome from './pages/SubsiteHome';
import SubsiteFrise from './pages/SubsiteFrise';
import SubsitePartners from './pages/SubsitePartners';
import SubsiteAdmin from './pages/SubsiteAdmin';
import CartelDetail from './pages/CartelDetail';

// Reset du scroll sur changement de route. React Router en SPA conserve la
// position Y de la page précédente, ce qui faisait apparaître les pages
// suivantes (Create, ManageCartels, etc.) déjà scrollées et avec leur header
// coupé. On laisse passer les ancres `#cartel-<id>` posées par rememberReturn,
// que ManageCartels/Admin/Library gèrent eux-mêmes via scrollIntoView.
function ScrollToTopOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    if ((location.hash || '').startsWith('#cartel-')) return;
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return null;
}

// Toast applicatif global, monté au-dessus de tout. Sert aux notifications
// déclenchées par le contexte (session expirée depuis un autre onglet,
// erreurs cross-page, etc.). Doit être un descendant de AppProvider pour
// pouvoir lire le state du contexte.
function GlobalToast() {
  const { globalToast, setGlobalToast } = useApp();
  return (
    <Toast
      visible={!!globalToast}
      type={globalToast?.type}
      message={globalToast?.message}
      onDismiss={() => setGlobalToast(null)}
      autoDismiss={6000}
    />
  );
}

// AppProvider doit être à l'intérieur du router (il utilise useLocation/useNavigate),
// donc on l'expose via un layout racine dont chaque branche est enfant.
function RootLayout() {
  return (
    <AppProvider>
      <ScrollToTopOnRouteChange />
      <GlobalToast />
      <Outlet />
    </AppProvider>
  );
}

function WorkshopRedirect() {
  const { workshopId } = useParams();
  return <Navigate to={`/app/workshop/${workshopId}`} replace />;
}

// Catch-all monté sur les hosts subsite dédiés (paleo-h2o.org, etc.) :
// si quelqu'un atterrit sur `/site/<slug>/<reste>`, on canonicalise vers
// `/<reste>`. Tout autre chemin inconnu retombe sur la home du subsite.
function SubsiteHostCatchAll({ hostSlug }) {
  const location = useLocation();
  const m = location.pathname.match(/^\/site\/([^/]+)(\/.*)?$/);
  if (m && m[1] === hostSlug) {
    return <Navigate to={m[2] || '/'} replace />;
  }
  return <Navigate to="/" replace />;
}

// Sélection du routeur :
//   - sur un host de sous-site dédié (cf. utils/subsiteHost) → BrowserRouter
//     avec routes plates (`/`, `/frise`, `/admin/...`) servies par Express.
//     L'URL reste propre dans la barre d'adresse (paleo-h2o.org/frise).
//   - sinon → createHashRouter historique, inchangé. Tous les anciens liens
//     `#/site/<slug>/...` continuent de marcher comme avant.
// Note : on utilise createHashRouter (data router) plutôt que <HashRouter>
// legacy pour débloquer useBlocker (Create.jsx confirme la sortie d'un
// formulaire modifié).

const hostSubsiteSlug = getHostSubsiteSlug();

const mainRouter = createHashRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      {/* ── Site public ──────────────────────────────── */}
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="presentation" element={<Presentation />} />
        <Route path="prestations"  element={<Prestations />} />
        <Route path="boutique"     element={<Ouvrages />} />
        {/* Ancienne URL conservée pour ne pas casser les liens externes */}
        <Route path="ouvrages"     element={<Navigate to="/boutique" replace />} />
        <Route path="museum"       element={<Museum />} />
        <Route path="participer"   element={<Participer />} />
        <Route path="presse"       element={<Presse />} />
        {/* La page Partenaires dédiée a été retirée — son contenu est désormais
            intégré à /presentation. On redirige pour ne pas casser les liens externes. */}
        <Route path="partenaires"  element={<Navigate to="/presentation" replace />} />
        <Route path="contact"      element={<Contact />} />
        <Route path="politique-confidentialite" element={<PrivacyPolicy />} />
        <Route path="mentions-legales" element={<LegalNotices />} />
        <Route path="cartel/:id" element={<CartelDetail />} />
      </Route>

      {/* ── Sous-sites (/site/:slug/*) ────────────────── */}
      <Route path="/site/:slug" element={<SubsiteLayout />}>
        <Route index                   element={<SubsiteHome />} />
        <Route path="frise"            element={<SubsiteFrise viewMode="timeline" />} />
        <Route path="carte"            element={<SubsiteFrise viewMode="map" />} />
        <Route path="arborescence"     element={<SubsiteFrise viewMode="arborescence" />} />
        <Route path="presentation"     element={<Presentation />} />
        <Route path="partenaires"      element={<SubsitePartners />} />
        <Route path="mentions"         element={<Presentation />} />
        <Route path="admin"            element={<SubsiteAdmin />} />
        <Route path="admin/drafts"     element={<SubsiteAdmin />} />
        <Route path="admin/pending"    element={<SubsiteAdmin />} />
        <Route path="admin/published"  element={<SubsiteAdmin />} />
        <Route path="admin/submissions" element={<SubsiteAdmin />} />
        <Route path="cartel/:id" element={<CartelDetail />} />
      </Route>

      {/* ── Application (frise + gestion) ────────────── */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<Library viewMode="timeline" />} />
        <Route path="carte"         element={<Library viewMode="map" />} />
        <Route path="arborescence"  element={<Library viewMode="arborescence" />} />
        <Route path="workshop/:workshopId" element={<Library viewMode="timeline" />} />
        <Route path="create" element={<Create />} />
        <Route path="manage"            element={<Navigate to="/app/manage/published" replace />} />
        <Route path="manage/drafts"     element={<ManageCartels />} />
        <Route path="manage/pending"    element={<ManageCartels />} />
        <Route path="manage/published"  element={<ManageCartels />} />
        <Route path="manage/submissions" element={<ManageCartels />} />
        <Route path="admin"             element={<AdminSettings />} />
        <Route path="admin/partners"    element={<AdminPartners />} />
        <Route path="admin/team"        element={<AdminTeam />} />
        <Route path="admin/team-content" element={<AdminTeamContent />} />
        <Route path="admin/press"        element={<AdminPress />} />
        <Route path="admin/missions"     element={<AdminMissions />} />
        <Route path="admin/prestations"  element={<AdminPrestations />} />
        <Route path="admin/shop"         element={<AdminShop />} />
        <Route path="admin/taxonomies"  element={<AdminCategoriesWorkshops />} />
        <Route path="admin/logs"        element={<AdminLogs />} />
        <Route path="admin/stats"       element={<AdminStats />} />
        <Route path="admin/workshop/:workshopId" element={<ManageCartels />} />
        <Route path="drafts" element={<Navigate to="/app/manage/pending" replace />} />
      </Route>

      {/* Route de proposition de cartel sur un sous-site (visiteurs) */}
      <Route path="/site/:slug/create" element={<Create />} />

      {/* Redirect workshops (anciens liens partagés) */}
      <Route path="/workshop/:workshopId" element={<WorkshopRedirect />} />
    </Route>
  )
);

const subsiteHostRouter = hostSubsiteSlug ? createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/" element={<SubsiteLayout />}>
        <Route index                   element={<SubsiteHome />} />
        <Route path="frise"            element={<SubsiteFrise viewMode="timeline" />} />
        <Route path="carte"            element={<SubsiteFrise viewMode="map" />} />
        <Route path="arborescence"     element={<SubsiteFrise viewMode="arborescence" />} />
        <Route path="presentation"     element={<Presentation />} />
        <Route path="partenaires"      element={<SubsitePartners />} />
        <Route path="mentions"         element={<Presentation />} />
        <Route path="admin"            element={<SubsiteAdmin />} />
        <Route path="admin/drafts"     element={<SubsiteAdmin />} />
        <Route path="admin/pending"    element={<SubsiteAdmin />} />
        <Route path="admin/published"  element={<SubsiteAdmin />} />
        <Route path="admin/submissions" element={<SubsiteAdmin />} />
        <Route path="cartel/:id" element={<CartelDetail />} />
      </Route>
      <Route path="/create" element={<Create />} />
      <Route path="*" element={<SubsiteHostCatchAll hostSlug={hostSubsiteSlug} />} />
    </Route>
  )
) : null;

const router = subsiteHostRouter || mainRouter;

function App() {
  return <RouterProvider router={router} />;
}

export default App;
