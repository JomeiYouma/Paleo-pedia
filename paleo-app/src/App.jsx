import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import ManageCartels from './pages/ManageCartels';
import AdminSettings from './pages/AdminSettings';
import Presentation from './pages/Presentation';
import Prestations from './pages/Prestations';
import Ouvrages from './pages/Ouvrages';
import Museum from './pages/Museum';
import Contact from './pages/Contact';
import Partners from './pages/Partners';
import LandingPage from './pages/LandingPage';
import SiteLayout from './components/SiteLayout';
import SubsiteLayout from './layouts/SubsiteLayout';
import SubsiteHome from './pages/SubsiteHome';
import SubsiteFrise from './pages/SubsiteFrise';
import SubsitePartners from './pages/SubsitePartners';

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Routes>
          {/* ── Site public ──────────────────────────────── */}
          <Route path="/" element={<SiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="presentation" element={<Presentation />} />
            <Route path="prestations"  element={<Prestations />} />
            <Route path="ouvrages"     element={<Ouvrages />} />
            <Route path="museum"       element={<Museum />} />
            <Route path="partenaires"  element={<Partners />} />
            <Route path="contact"      element={<Contact />} />
          </Route>

          {/* ── Sous-sites (/site/:slug/*) ────────────────── */}
          <Route path="/site/:slug" element={<SubsiteLayout />}>
            <Route index                   element={<SubsiteHome />} />
            <Route path="frise"            element={<SubsiteFrise />} />
            <Route path="presentation"     element={<Presentation />} />
            <Route path="partenaires"      element={<SubsitePartners />} />
            <Route path="mentions"         element={<Presentation />} />
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
            <Route path="admin/workshop/:workshopId" element={<ManageCartels />} />
            <Route path="drafts" element={<Navigate to="/app/manage/pending" replace />} />
          </Route>

          {/* Redirect workshops (anciens liens partagés) */}
          <Route path="/workshop/:workshopId" element={<WorkshopRedirect />} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}

function WorkshopRedirect() {
  const { workshopId } = useParams();
  return <Navigate to={`/app/workshop/${workshopId}`} replace />;
}

export default App;
