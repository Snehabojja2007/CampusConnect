import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  SearchX,
  PackageCheck,
  ClipboardList,
  Handshake,
  ShieldCheck,
  Bell,
  Settings2,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../api/notificationsApi';
import StatusTag from './StatusTag';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/lost-items': 'Lost Items Registry',
  '/found-items': 'Found Items Registry',
  '/claims': 'My Claims',
  '/handovers': 'Handovers',
  '/security': 'Security Operations Desk',
  '/notifications': 'Notifications',
  '/admin': 'Admin Console',
  '/profile': 'My Profile',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const page = await notificationsApi.getMyNotifications({ page: 0, size: 50 });
      const items = page?.content || [];
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Silently ignore badge refresh failure if offline
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const handleRefresh = () => loadUnreadCount();
    window.addEventListener('campusconnect:notifications-updated', handleRefresh);
    return () => window.removeEventListener('campusconnect:notifications-updated', handleRefresh);
  }, [loadUnreadCount, location.pathname]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role;
  const isSecurityOrAdmin = role === 'SECURITY' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const pageTitle = PAGE_TITLES[location.pathname] || 'CampusConnect';

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand">
          <NavLink to="/dashboard" className="brand-wordmark">
            CampusConnect
          </NavLink>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Workspace</div>
            <NavLink to="/dashboard" className="nav-link">
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/lost-items" className="nav-link">
              <SearchX size={17} />
              <span>Lost Items</span>
            </NavLink>
            <NavLink to="/found-items" className="nav-link">
              <PackageCheck size={17} />
              <span>Found Items</span>
            </NavLink>
            <NavLink to="/claims" className="nav-link">
              <ClipboardList size={17} />
              <span>My Claims</span>
            </NavLink>
            <NavLink to="/handovers" className="nav-link">
              <Handshake size={17} />
              <span>Handovers</span>
            </NavLink>
            <NavLink to="/notifications" className="nav-link">
              <Bell size={17} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className="nav-link-badge">{unreadCount}</span>}
            </NavLink>
            <NavLink to="/profile" className="nav-link">
              <User size={17} />
              <span>My Profile</span>
            </NavLink>
          </div>

          {isSecurityOrAdmin && (
            <div className="nav-section">
              <div className="nav-section-title">Operations</div>
              <NavLink to="/security" className="nav-link">
                <ShieldCheck size={17} />
                <span>Security Desk</span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="nav-link">
                  <Settings2 size={17} />
                  <span>Admin Console</span>
                </NavLink>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-summary">
            <div className="user-summary-name">{user?.name || 'Campus User'}</div>
            <div className="user-summary-meta">{user?.email}</div>
            <div style={{ marginTop: '4px' }}>
              <StatusTag status={role} />
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm btn-block" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <span className="topbar-breadcrumb">{pageTitle}</span>
          </div>

          <div className="topbar-right">
            <NavLink to="/notifications" className="btn btn-secondary btn-sm">
              <Bell size={15} />
              <span>Notifications</span>
              {unreadCount > 0 && <span className="mono">({unreadCount})</span>}
            </NavLink>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
