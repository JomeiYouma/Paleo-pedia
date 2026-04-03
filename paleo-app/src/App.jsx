import React from 'react';
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Library from './pages/Library';
import Create from './pages/Create';
import Drafts from './pages/Drafts';
import Admin from './pages/Admin';
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
          {/* Public Site Routes */}
          <Route path="/" element={<SiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="presentation" element={<Presentation />} />
            <Route path="prestations" element={<Prestations />} />
            <Route path="ouvrages" element={<Ouvrages />} />
            <Route path="museum" element={<Museum />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Application Routes */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Library />} />
            <Route path="workshop/:workshopId" element={<Library />} />
            <Route path="create" element={<Create />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="admin" element={<Admin />} />
            <Route path="admin/workshop/:workshopId" element={<Admin />} />
          </Route>

          {/* Compatibility Redirect for old Workshop Links */}
          <Route path="/workshop/:workshopId" element={<WorkshopRedirect />} />
        </Routes>
      </AppProvider>
    </HashRouter>
  );
}

// Redirect Helper Component
function WorkshopRedirect() {
  const { workshopId } = useParams();
  return <Navigate to={`/app/workshop/${workshopId}`} replace />;
}

export default App;
