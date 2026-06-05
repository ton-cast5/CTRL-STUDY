import { Layout } from './components/Layout';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { TutorDashboard } from './screens/TutorDashboard';
import { Agenda } from './screens/Agenda';
import { Recursos } from './screens/Recursos';
import { Progreso } from './screens/Progreso';
import { Mensajes } from './screens/Mensajes';
import { useApp } from './context/AppContext';
import { ChatPanel } from './components/ChatPanel';

function App() {
  const { profile, role, userName, logout, loading, sessionRestoring, error, screen, navigate } = useApp();

  if (sessionRestoring) {
    return (
      <div className="global-loading session-restore" role="status">
        Restaurando sesión...
      </div>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  const roleLabel = role === 'tutor' ? 'Tutor DACYTI' : 'Estudiante UJAT';

  const screens = {
    dashboard: role === 'tutor' ? <TutorDashboard /> : <Dashboard />,
    agenda: <Agenda role={role} />,
    mensajes: <Mensajes />,
    recursos: <Recursos />,
    progreso: <Progreso role={role} />,
  } as const;

  return (
    <>
      {loading && (
        <div className="global-loading" role="status">
          Cargando datos...
        </div>
      )}
      {error && (
        <div className="global-error" role="alert">
          {error}
        </div>
      )}
      <Layout
        activeScreen={screen}
        onNavigate={navigate}
        userName={userName}
        userRole={roleLabel}
        role={role}
        onLogout={logout}
      >
        {screens[screen]}
      </Layout>
      <ChatPanel />
    </>
  );
}

export default App;
