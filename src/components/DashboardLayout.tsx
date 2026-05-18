import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Target,
  Users,
  BarChart3,
  History,
  LogOut,
  Menu,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'formulario', label: 'Formulário Inicial', icon: FileText, path: '/dashboard/initial-form' },
  { id: 'consultoria', label: 'Consultoria IA', icon: Bot, path: '/dashboard/consultoria-ia' },
  { id: 'objetivos', label: 'Objetivos', icon: Target, path: '/dashboard/objetivos' },
  { id: 'equipe', label: 'Minha Equipe', icon: Users, path: '/dashboard/minha-equipe' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, path: '/dashboard/relatorios' },
  { id: 'historico', label: 'Histórico', icon: History, path: '/dashboard/historico' },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isConsultoria = location.pathname === '/dashboard/consultoria-ia';

  const handleNav = (_id: string, path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-body">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <img src="/icone-magnusmind.svg" alt="Magnus Mind" className="sidebar-logo" />
            <p className="logo-text">magnus mind</p>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.path ||
                (item.path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/'));
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => handleNav(item.id, item.path)}
                >
                  <Icon className="nav-icon" size={20} />
                  <span className="nav-label">{item.label}</span>
                </button>
              );
            })}
            <button type="button" className="nav-item nav-item-logout" onClick={handleLogout}>
              <LogOut className="nav-icon" size={20} />
              <span className="nav-label">Sair</span>
            </button>
          </nav>
        </aside>
        <div className={`dashboard-main-wrapper ${isConsultoria ? 'consultoria-ia-active' : ''}`}>
          <header className="dashboard-header">
            <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu">
              <Menu size={40} />
            </button>
          </header>
          <main className={`dashboard-main ${isConsultoria ? 'consultoria-ia-active' : ''}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
