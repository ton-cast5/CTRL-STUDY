import type { ReactNode } from 'react';
import type { UserRole } from '../data/mockData';
import {
  IconUsers,
  IconCalendar,
  IconFolder,
  IconChart,
  IconLogOut,
  IconMessage,
} from './Icons';
import { useApp } from '../context/AppContext';
import './Layout.css';

export type Screen = 'dashboard' | 'agenda' | 'mensajes' | 'recursos' | 'progreso';

interface LayoutProps {
  children: ReactNode;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userName: string;
  userRole: string;
  role: UserRole;
  onLogout: () => void;
}

const studentNav: { id: Screen; label: string; Icon: typeof IconUsers }[] = [
  { id: 'dashboard', label: 'Tutores', Icon: IconUsers },
  { id: 'agenda', label: 'Agenda', Icon: IconCalendar },
  { id: 'mensajes', label: 'Mensajes', Icon: IconMessage },
  { id: 'recursos', label: 'Recursos', Icon: IconFolder },
  { id: 'progreso', label: 'Progreso', Icon: IconChart },
];

const tutorNav: { id: Screen; label: string; Icon: typeof IconUsers }[] = [
  { id: 'dashboard', label: 'Mi panel', Icon: IconUsers },
  { id: 'agenda', label: 'Mis citas', Icon: IconCalendar },
  { id: 'mensajes', label: 'Mensajes', Icon: IconMessage },
  { id: 'recursos', label: 'Recursos', Icon: IconFolder },
  { id: 'progreso', label: 'Estadísticas', Icon: IconChart },
];

export function Layout({
  children,
  activeScreen,
  onNavigate,
  userName,
  userRole,
  role,
  onLogout,
}: LayoutProps) {
  const { requests } = useApp();
  const navItems = role === 'tutor' ? tutorNav : studentNav;
  const unreadChats = requests.filter((r) => r.status === 'aceptada').length;
  return (
    <div className="layout">
      <aside className="sidebar animate-in">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Ctrl+Study" className="sidebar-logo" />
          <div>
            <span className="brand-ctrl">Ctrl+</span>
            <span className="brand-study">Study</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${activeScreen === id ? 'active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === 'mensajes' && unreadChats > 0 && (
                <span className="nav-badge">{unreadChats}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{userName.slice(0, 2).toUpperCase()}</div>
            <div>
              <p className="user-name">{userName}</p>
              <p className="user-role">{userRole}</p>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout} aria-label="Cerrar sesión">
            <IconLogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav-item ${activeScreen === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="bottom-nav-icon-wrap">
              <Icon size={22} />
              {id === 'mensajes' && unreadChats > 0 && (
                <span className="nav-badge bottom">{unreadChats}</span>
              )}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
