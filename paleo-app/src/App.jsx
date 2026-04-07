import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import ManageCartels from './pages/ManageCartels';   // ← NOUVEAU (remplace Admin + Drafts)
import AdminSettings from './pages/AdminSettings';   // ← NOUVEAU
import Presentation from './pages/Presentation';
import Prestations from './pages/Prestations';
import Ouvrages from './pages/Ouvrages';
import Museum from './pages/Museum';
import Contact from './pages/Contact';
import LandingPage from './pages/LandingPage';
import SiteLayout from './components/SiteLayout';

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
            <Route path="contact"      element={<Contact />} />
          </Route>

          {/* ── Application (frise + gestion) ────────────── */}
          <Route path="/app" element={<Layout />}>
            {/* Frise */}
            <Route index element={<Library />} />
            <Route path="workshop/:workshopId" element={<Library />} />

            {/* Création / édition */}
            <Route path="create" element={<Create />} />

            {/* Gestion des cartels (brouillons / propositions / publiés)
                L'onglet actif est contrôlé par ?tab=drafts|pending|published */}
            <Route path="manage/drafts"    element={<ManageCartels />} />
            <Route path="manage/pending"   element={<ManageCartels />} />
            <Route path="manage/published" element={<ManageCartels />} />

            {/* Paramètres admin */}
            <Route path="admin" element={<AdminSettings />} />

            {/* ── Rétrocompatibilité avec anciens liens ─── */}
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
