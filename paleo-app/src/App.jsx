import React, { useEffect } from 'react';
import {
  createHashRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  Route,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import ManageCartels from './pages/ManageCartels';
import AdminSettings from './pages/AdminSettings';
import AdminPartners from './pages/AdminPartners';
import AdminTeam from './pages/AdminTeam';
import AdminCategoriesWorkshops from './pages/AdminCategoriesWorkshops';
import AdminLogs from './pages/AdminLogs';
import Presentation from './pages/Presentation';
import Prestations from './pages/Prestations';
import Ouvrages from './pages/Ouvrages';
import Museum from './pages/Museum';
import Contact from './pages/Contact';
import Partners from './pages/Partners';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SiteLayout from './components/SiteLayout';
import SubsiteLayout from './layouts/SubsiteLayout';
import SubsiteHome from './pages/SubsiteHome';
import SubsiteFrise from './pages/SubsiteFrise';
import SubsitePartners from './pages/SubsitePartners';
import SubsiteAdmin from './pages/SubsiteAdmin';

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

// AppProvider doit être à l'intérieur du router (il utilise useLocation/useNavigate),
// donc on l'expose via un layout racine dont chaque branche est enfant.
function RootLayout() {
  return (
    <AppProvider>
      <ScrollToTopOnRouteChange />
      <Outlet />
    </AppProvider>
  );
}

function WorkshopRedirect() {
  const { workshopId } = useParams();
  return <Navigate to={`/app/workshop/${workshopId}`} replace />;
}

// On utilise createHashRouter (data router) plutôt que <HashRouter> legacy :
// c'est ce qui débloque useBlocker pour confirmer la sortie d'un formulaire
// modifié (Create.jsx). Syntaxe JSX préservée via createRoutesFromElements.
const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      {/* ── Site public ──────────────────────────────── */}
      <Route path="/" element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="presentation" element={<Presentation />} />
        <Route path="prestations"  element={<Prestations />} />
        <Route path="ouvrages"     element={<Ouvrages />} />
        <Route path="museum"       element={<Museum />} />
        <Route path="partenaires"  element={<Partners />} />
        <Route path="contact"      element={<Contact />} />
        <Route path="politique-confidentialite" element={<PrivacyPolicy />} />
      </Route>

      {/* ── Sous-sites (/site/:slug/*) ────────────────── */}
      <Route path="/site/:slug" element={<SubsiteLayout />}>
        <Route index                   element={<SubsiteHome />} />
        <Route path="frise"            element={<SubsiteFrise />} />
        <Route path="presentation"     element={<Presentation />} />
        <Route path="partenaires"      element={<SubsitePartners />} />
        <Route path="mentions"         element={<Presentation />} />
        <Route path="admin"            element={<SubsiteAdmin />} />
        <Route path="admin/drafts"     element={<SubsiteAdmin />} />
        <Route path="admin/pending"    element={<SubsiteAdmin />} />
        <Route path="admin/published"  element={<SubsiteAdmin />} />
        <Route path="admin/submissions" element={<SubsiteAdmin />} />
      </Route>

      {/* ── Application (frise + gestion) ────────────── */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<Library />} />
        <Route path="workshop/:workshopId" element={<Library />} />
        <Route path="create" element={<Create />} />
        <Route path="manage"            element={<Navigate to="/app/manage/drafts" replace />} />
        <Route path="manage/drafts"     element={<ManageCartels />} />
        <Route path="manage/pending"    element={<ManageCartels />} />
        <Route path="manage/published"  element={<ManageCartels />} />
        <Route path="manage/submissions" element={<ManageCartels />} />
        <Route path="admin"             element={<AdminSettings />} />
        <Route path="admin/partners"    element={<AdminPartners />} />
        <Route path="admin/team"        element={<AdminTeam />} />
        <Route path="admin/taxonomies"  element={<AdminCategoriesWorkshops />} />
        <Route path="admin/logs"        element={<AdminLogs />} />
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

function App() {
  return <RouterProvider router={router} />;
}

export default App;
