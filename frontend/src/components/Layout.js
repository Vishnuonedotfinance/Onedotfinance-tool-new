import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Home, Users, FileText, Users2, Briefcase, CheckCircle, DollarSign, BarChart3, LogOut, Package, UserPlus, ShoppingCart, Settings as SettingsIcon } from 'lucide-react';

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedMenus, setExpandedMenus] = useState({
    clients: true,
    people: true,
    trackers: true
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          {localStorage.getItem('org_logo') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src={`${process.env.REACT_APP_BACKEND_URL}${localStorage.getItem('org_logo')}`}
                alt="Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '8px',
                  objectFit: 'cover',
                  background: 'white',
                  padding: '2px'
                }} 
                onError={(e) => {
                  console.error('Logo failed to load:', e.target.src);
                  console.error('Logo URL from localStorage:', localStorage.getItem('org_logo'));
                  e.target.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', localStorage.getItem('org_logo'));
                }}
              />
              <h2>{localStorage.getItem('org_name') || 'One.Finance'}</h2>
            </div>
          ) : (
            <h2>{localStorage.getItem('org_name') || 'One.Finance Tool'}</h2>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            data-testid="nav-dashboard"
          >
            <Home /> Dashboard
          </Link>

          {user.role === 'Admin' && (
            <Link
              to="/users"
              className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
              data-testid="nav-users"
            >
              <Users /> Users
            </Link>
          )}

          <div>
            <div className="nav-item" onClick={() => toggleMenu('clients')}>
              <FileText /> Clients
              {expandedMenus.clients ? <ChevronDown size={16} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </div>
            {expandedMenus.clients && (
              <div className="nav-submenu">
                <Link to="/clients" className={`nav-item ${location.pathname === '/clients' ? 'active' : ''}`} data-testid="nav-client-database">
                  Client Database
                </Link>
                <Link to="/client-onboarding" className={`nav-item ${location.pathname === '/client-onboarding' ? 'active' : ''}`} data-testid="nav-client-onboarding">
                  Client Onboarding
                </Link>
              </div>
            )}
          </div>

          <div>
            <div className="nav-item" onClick={() => toggleMenu('people')}>
              <Users2 /> People
              {expandedMenus.people ? <ChevronDown size={16} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </div>
            {expandedMenus.people && (
              <div className="nav-submenu">
                <Link to="/contractors" className={`nav-item ${location.pathname === '/contractors' ? 'active' : ''}`} data-testid="nav-contractor-database">
                  Contractor Database
                </Link>
                <Link to="/employees" className={`nav-item ${location.pathname === '/employees' ? 'active' : ''}`} data-testid="nav-employee-database">
                  Employee Database
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/approval"
            className={`nav-item ${location.pathname === '/approval' ? 'active' : ''}`}
            data-testid="nav-approval"
          >
            <CheckCircle /> Approval
          </Link>

          <div>
            <div className="nav-item" onClick={() => toggleMenu('trackers')}>
              <Package /> Other Trackers
              {expandedMenus.trackers ? <ChevronDown size={16} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
            </div>
            {expandedMenus.trackers && (
              <div className="nav-submenu">
                <Link to="/asset-tracker" className={`nav-item ${location.pathname === '/asset-tracker' ? 'active' : ''}`} data-testid="nav-asset-tracker">
                  Asset Tracker
                </Link>
                <Link to="/consumables" className={`nav-item ${location.pathname === '/consumables' ? 'active' : ''}`} data-testid="nav-consumables">
                  Consumables
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/reports"
            className={`nav-item ${location.pathname === '/reports' ? 'active' : ''}`}
            data-testid="nav-reports"
          >
            <BarChart3 /> Reports
          </Link>

          {user.role === 'Admin' && (
            <Link
              to="/settings"
              className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
              data-testid="nav-settings"
            >
              <SettingsIcon /> Settings
            </Link>
          )}

          <a
            href="https://www.zoho.com/payroll/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            data-testid="nav-payroll"
          >
            <DollarSign /> Payroll
          </a>

          <a
            href="https://lookerstudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            data-testid="nav-financial-dashboard"
          >
            <BarChart3 /> Financial Dashboard
          </a>
        </nav>

        <div className="sidebar-footer">
          tool powered by one.Finance<br />(www.onedotfinance.com)
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h3>{localStorage.getItem('org_name') || 'One.Finance Tool'}</h3>
          </div>
          <div className="topbar-right">
            <div className="datetime" data-testid="datetime-display">
              {formatDateTime(currentTime)}
            </div>
            <div className="user-menu" data-testid="user-menu">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="btn-icon"
                data-testid="logout-button"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
