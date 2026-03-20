import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, Briefcase, Settings, LogOut,
    Bell, Search, Sun, Moon, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function AdminLayout() {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();

    const [collapsed, setCollapsed] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [globalSearch, setGlobalSearch] = useState('');

    // Load theme preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('admin-theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        const themeStr = newTheme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', themeStr);
        localStorage.setItem('admin-theme', themeStr);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleGlobalSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (globalSearch.trim()) {
            navigate(`/users?q=${encodeURIComponent(globalSearch.trim())}`);
            setGlobalSearch('');
        }
    };

    return (
        <div className="admin-layout">
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header" style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src="/logo.png" alt="Indian Master Logo" className="logo-glow" style={{ height: '35px', width: 'auto', objectFit: 'contain' }} />
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end title="Dashboard">
                        <LayoutDashboard size={20} />
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Users & Workers">
                        <Users size={20} />
                        {!collapsed && <span>Users & Workers</span>}
                    </NavLink>
                    <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Job Postings">
                        <Briefcase size={20} />
                        {!collapsed && <span>Job Postings</span>}
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Settings">
                        <Settings size={20} />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        className="nav-item"
                        style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', justifyContent: collapsed ? 'center' : 'flex-start' }}
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '85px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 100
                    }}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </aside>

            <main className="main-content">
                <header className="header">
                    <div className="search-wrapper">
                        <form className="search-bar" onSubmit={handleGlobalSearch}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search everything (users, jobs, etc...)"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                            <div className="search-shortcut">
                                <span>⌘</span>
                                <span>K</span>
                            </div>
                        </form>
                    </div>

                    <div className="user-profile">
                        <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="btn-icon" title="Notifications">
                            <Bell size={20} />
                        </button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                        <div className="avatar">AD</div>
                        {!collapsed && (
                            <div style={{ lineHeight: '1.2' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Admin Superuser</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email || 'admin@example.com'}</div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="page-content animate-slide-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
