import { Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Home } from '../pages/Home';
import { Needs } from '../pages/Needs';
import { Panel } from '../pages/Panel';
import { RequestsAdmin } from '../pages/RequestsAdmin';
import { Access } from '../pages/Access';
import { Profile } from '../pages/Profile';
import { Donate } from '../pages/Donate';
import { RequestForm } from '../pages/RequestForm';
import { Chat } from '../pages/Chat';
import { Register } from '../pages/Register';
import { RequireSession } from './RequireSession';

export function AppRoutes({ session, onLogin, onOpenGoogleAuth, onOpenNeedModal, onLogout }) {
  const location = useLocation();
  const privateRoute = element => (
    <RequireSession session={session} onOpenGoogleAuth={onOpenGoogleAuth}>
      {element}
    </RequireSession>
  );

  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home onOpenNeedModal={onOpenNeedModal} session={session} />} />
        <Route path="/necesidades" element={<Needs onOpenNeedModal={onOpenNeedModal} />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/registro" element={<Register onLogin={onLogin} />} />
        <Route path="/solicitudes" element={privateRoute(<RequestsAdmin session={session} onOpenGoogleAuth={onOpenGoogleAuth} />)} />
        <Route path="/panel" element={privateRoute(<Panel session={session} onLogin={onLogin} onOpenGoogleAuth={onOpenGoogleAuth} />)} />
        <Route path="/acceso" element={<Access onOpenGoogleAuth={onOpenGoogleAuth} />} />
        <Route path="/perfil" element={privateRoute(<Profile session={session} onUpdateSession={onLogin} onLogout={onLogout} onOpenGoogleAuth={onOpenGoogleAuth} />)} />
        <Route path="/donar" element={privateRoute(<Donate session={session} />)} />
        <Route path="/solicitar" element={privateRoute(<RequestForm session={session} />)} />
        <Route path="*" element={<Home onOpenNeedModal={onOpenNeedModal} />} />
      </Routes>
    </ErrorBoundary>
  );
}
