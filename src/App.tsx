import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SuggestPage from './pages/SuggestPage';
import InboxPage from './pages/InboxPage';
import AdminPage from './pages/AdminPage';
import PersonaPage from './pages/PersonaPage';
import PrintAreasPage from './pages/PrintAreasPage';
import PrintCardsPage from './pages/PrintCardsPage';

export default function App() {
  return (
    <Routes>
      {/* Páginas que se abren al escanear un QR (sin menú, pensadas para celular) */}
      <Route path="/s/:areaId" element={<SuggestPage />} />
      <Route path="/p/:personaId" element={<PersonaPage />} />

      {/* Páginas de impresión */}
      <Route path="/imprimir/areas" element={<PrintAreasPage />} />
      <Route path="/imprimir/fotochecks" element={<PrintCardsPage />} />

      {/* Páginas internas con menú */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bandeja" element={<InboxPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<p className="empty">Página no encontrada.</p>} />
      </Route>
    </Routes>
  );
}
