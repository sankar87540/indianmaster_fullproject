import { Users, Briefcase, Building, Activity, TrendingUp, Eye, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { downloadCSV } from '../lib/exportUtils';

const RECENT_USERS = [
    { name: 'Sanjay Kumar', phone: '+91 9876543210', role: 'WORKER', status: 'ACTIVE', joined: '2026-03-11, 09:41 AM' },
    { name: 'Taj Grand Hotel', phone: '+91 8888888888', role: 'HIRER', status: 'PENDING', joined: '2026-03-11, 08:15 AM' },
    { name: 'Riya Arora', phone: '+91 9123456780', role: 'WORKER', status: 'ACTIVE', joined: 'Yesterday' },
    { name: 'Spice Kitchen', phone: '+91 7777777777', role: 'HIRER', status: 'REJECTED', joined: 'Mar 09, 2026' },
];

export default function Dashboard() {
    const navigate = useNavigate();

    const handleDownloadReport = () => {
        downloadCSV(RECENT_USERS, `recent_registrations_${new Date().toISOString().split('T')[0]}`);
    };

    const handleViewUser = (name: string) => {
        alert(`Opening details for ${name}. In the full version, this might open a modal or navigate to their profile.`);
    };

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="text-h2" style={{ marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
                    <p className="text-muted">Welcome back! Here's a snapshot of your platform today.</p>
                </div>
                <button className="btn btn-primary" onClick={handleDownloadReport} style={{ gap: '0.5rem' }}>
                    <Download size={18} /> Export Data
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--accent-primary)' }}>
                            <Users size={26} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <ArrowUpRight size={16} /> 12%
                        </div>
                    </div>
                    <div className="stat-info">
                        <h3>Total Active Workers</h3>
                        <p>12,482</p>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/users')} style={{ cursor: 'pointer' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <Building size={26} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <ArrowUpRight size={16} /> 8%
                        </div>
                    </div>
                    <div className="stat-info">
                        <h3>Registered Hirers</h3>
                        <p>1,204</p>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                            <Briefcase size={26} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <ArrowUpRight size={16} /> 24%
                        </div>
                    </div>
                    <div className="stat-info">
                        <h3>Open Job Positions</h3>
                        <p>3,842</p>
                    </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                            <Activity size={26} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>
                            <ArrowDownRight size={16} /> 3%
                        </div>
                    </div>
                    <div className="stat-info">
                        <h3>Pending Applications</h3>
                        <p>24,198</p>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2 className="table-title">Recent Registrations</h2>
                    <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.815rem' }} onClick={() => navigate('/users')}>
                        View All Activity
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Partner Name</th>
                                <th>Role</th>
                                <th>Verification Status</th>
                                <th>Onboarding Date</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {RECENT_USERS.map((user, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="avatar" style={{
                                                width: 38, height: 38, fontSize: '0.875rem',
                                                backgroundColor: user.role === 'HIRER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                                color: user.role === 'HIRER' ? 'var(--success)' : 'var(--accent-primary)',
                                                border: 'none', fontWeight: 700
                                            }}>
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.935rem' }}>{user.name}</div>
                                                <div style={{ fontSize: '0.815rem', color: 'var(--text-secondary)' }}>{user.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'WORKER' ? 'primary' : 'warning'}`} style={{ textTransform: 'capitalize' }}>
                                            {user.role.toLowerCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.status === 'ACTIVE' ? 'success' :
                                            user.status === 'PENDING' ? 'warning' : 'danger'
                                            }`}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                backgroundColor: user.status === 'ACTIVE' ? 'var(--success)' : user.status === 'PENDING' ? 'var(--warning)' : 'var(--danger)',
                                                marginRight: '8px'
                                            }}></span>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.joined}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => handleViewUser(user.name)} aria-label="View user details">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Active Sessions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                                    <span style={{ fontSize: '0.875rem' }}>Chennai Office Cluster - Node {i}</span>
                                </div>
                                <span style={{ fontSize: '0.815rem', color: 'var(--text-secondary)' }}>Online</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem' }}>API Response Time</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>142ms</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px' }}>
                            <div style={{ width: '85%', height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>Database Load</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--warning)' }}>64%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px' }}>
                            <div style={{ width: '64%', height: '100%', backgroundColor: 'var(--warning)', borderRadius: '4px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
