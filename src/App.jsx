import { ConfirmationDialog } from './components/ConfirmationDialog';
import { useDisplayPreferences } from './lib/useDisplayPreferences';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TriangleAlert, ArrowRightLeft, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './components/Logo';
import { GoogleAccessModal } from './components/GoogleAccessModal';
import { NeedDetailModal } from './components/NeedDetailModal';
import { RoleAvatar, roleIcons } from './components/ShellParts';
import { api } from './lib/api';
import { useData } from './lib/useData';
import { AppRoutes } from './routes/AppRoutes';

const PRIVATE_PATHS = ['/panel', '/perfil', '/donar', '/solicitar', '/solicitudes'];

function Shell() {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  useDisplayPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const { data: users = [], state: usersState, retry: retryUsers } = useData('/auth/demo-users');
  const navigate = useNavigate();
  const location = useLocation();

  const closeGoogleModal = useCallback(() => setGoogleModalOpen(false), []);
  const login = useCallback((user) => {
    setSession(user);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    api('/auth/session')
      .then(user => {
        if (mounted) setSession(user);
      })
      .catch(error => {
        if (error.status !== 401) console.error('No se pudo restaurar la sesión:', error);
      })
      .finally(() => {
        if (mounted) setSessionReady(true);
      });
    const handleUnauthorized = () => setSession(null);
    window.addEventListener('cr:unauthorized', handleUnauthorized);
    return () => {
      mounted = false;
      window.removeEventListener('cr:unauthorized', handleUnauthorized);
    };
  }, []);

  // Título de pestaña según la pantalla
  useEffect(() => {
    const titles = {
      '/': 'Inicio', '/necesidades': 'Necesidades', '/solicitudes': 'Solicitudes', '/panel': 'Panel de gestión', '/acceso': 'Acceso',
      '/registro': 'Registro', '/perfil': 'Perfil', '/donar': 'Donar', '/solicitar': 'Solicitar ayuda', '/chat': 'Asistente'
    };
    const t = titles[location.pathname];
    document.title = t ? `${t} · CR Conecta` : 'CR Conecta — Conectando personas · Construyendo paz';
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const pendingTarget = useMemo(() => {
    const requested = new URLSearchParams(location.search).get('redirect');
    return requested && PRIVATE_PATHS.includes(requested) ? requested : '/panel';
  }, [location.search]);

  const logout = async () => {
    setLogoutError('');
    try {
      await api('/auth/logout', { method: 'POST' });
      setSession(null);
      navigate('/');
    } catch (error) {
      if (error.status !== 0) setLogoutError(error.message);
    }
  };

  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <>
      {/* Top Banner Matching Mockup */}
      <div className="top-strip">
        PROPUESTA VISUAL · DATOS Y RECORRIDOS DE DEMOSTRACIÓN
      </div>

      {usersState === 'error' && (
        <div className="api-banner" role="alert">
          <TriangleAlert className="i i-l" size={15} />
          No se pudo conectar con la API local. Ejecutá <code>npm run server</code> en otra terminal.
          <button type="button" onClick={retryUsers}>Reintentar</button>
        </div>
      )}

      {/* Main Sticky Header */}
      {logoutError && <div className="api-banner" role="alert">{logoutError}</div>}
      <header className="header">
        <Link className="brand" to="/">
          <Logo />
        </Link>

        <button type="button" className="menu-toggle" aria-controls="site-navigation" aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(value => !value)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span>Menú</span>
        </button>
        <div id="site-navigation" className={`header-menu${menuOpen ? ' is-open' : ''}`}>
        <nav aria-label="Navegación principal" onClick={event => { if (event.target.closest('a')) setMenuOpen(false); }}>
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/necesidades">Necesidades</NavLink>

          <NavLink to="/donar">Donar</NavLink>

          <NavLink to="/solicitudes">Solicitudes</NavLink>

          <NavLink to="/panel">Panel de gestión</NavLink>
          <NavLink to="/chat">Asistente</NavLink>
        </nav>

        <div className="header-actions">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="profile-chip" onClick={() => { setMenuOpen(false); navigate('/perfil'); }}>
                <RoleAvatar src={roleIcons[session.role] || '/logo-mark.png'} alt={session.role} size={36} />
                <div>
                  <div style={{ lineHeight: '1.1' }}>{session.name.split(' ')[0]}</div>
                  <small style={{ fontSize: '0.6875rem', color: '#52758e', fontWeight: '600' }}>{session.role}</small>
                </div>
              </button>
              <button 
                className="btn secondary" 
                onClick={() => { setMenuOpen(false); setGoogleModalOpen(true); }}
                title="Cambiar de cuenta de demostración (Google/Gmail)"
                style={{ padding: '8px 12px', fontSize: '0.75rem' }}
              >
                Cambiar rol<ArrowRightLeft className="i i-r" size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn secondary"
                onClick={() => { setMenuOpen(false); navigate('/registro'); }}
                style={{ padding: '8px 12px', fontSize: '0.75rem' }}
              >
                Registrarme
              </button>
              <button className="btn primary" onClick={() => { setMenuOpen(false); setGoogleModalOpen(true); }}>
                Quiero ayudar
              </button>
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main aria-busy={!sessionReady}>
        <AppRoutes session={session} onLogin={login} onOpenGoogleAuth={() => setGoogleModalOpen(true)} onOpenNeedModal={setSelectedNeed} onLogout={logout} />
      </main>

      {/* Global Footer */}
      <footer>
        <div style={{ alignItems: 'center' }}>
          <img src="/logo-mark.png" width="32" height="32" alt="Logo de CR Conecta" style={{ borderRadius: 8 }} />
          <strong>CR CONECTA</strong>
          <span>Prototipo académico · Información ficticia para demostración</span>
        </div>
        <span>Google/Gmail · GPS · n8n · firmas · certificados: simulados</span>
      </footer>

      {/* Google/Gmail Visual Auth Modal (RF-01, RF-02) */}
      <GoogleAccessModal
        isOpen={googleModalOpen}
      onClose={closeGoogleModal}
        users={users || []}
        onSelectUser={(u) => {
          login(u);
          navigate(pendingTarget, { replace: true });
        }}
      />

      {/* Limited Need Card Modal for Donors & Volunteers (RF-06) */}
      <NeedDetailModal
        isOpen={Boolean(selectedNeed)}
        onClose={() => setSelectedNeed(null)}
        need={selectedNeed}
      />

      <ConfirmationDialog />
    </>
  );
}

export default function App() {
  return <Shell />;
}
