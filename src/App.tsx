import { Layout, type Screen } from './components/Layout';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { TutorDashboard } from './screens/TutorDashboard';
import { Agenda } from './screens/Agenda';
import { Recursos } from './screens/Recursos';
import { Progreso } from './screens/Progreso';
import { Mensajes } from './screens/Mensajes';
import { useApp } from './context/AppContext';
import { useState } from 'react';
import { ChatPanel } from './components/ChatPanel';

function App() {
  const { profile, role, userName, logout, loading, error } = useApp();
  const [screen, setScreen] = useState<Screen>('dashboard');

  if (!profile) {
    return <Onboarding />;
  }

  const roleLabel = role === 'tutor' ? 'Tutor DACYTI' : 'Estudiante UJAT';

  const screens: Record<Screen, React.ReactNode> = {
    dashboard: role === 'tutor' ? <TutorDashboard /> : <Dashboard />,
    agenda: <Agenda role={role} />,
    mensajes: <Mensajes />,
    recursos: <Recursos />,
    progreso: <Progreso role={role} />,
  };

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
        onNavigate={setScreen}
        userName={userName}
        userRole={roleLabel}
        role={role}
        onLogout={() => {
          logout();
          setScreen('dashboard');
        }}
      >
        {screens[screen]}
      </Layout>
      <ChatPanel />
    </>
  );
}

export default App;
