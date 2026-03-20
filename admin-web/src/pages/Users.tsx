import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Edit2, ShieldAlert, CheckCircle, Trash2, X, Plus, Download, Phone } from 'lucide-react';
import { downloadCSV } from '../lib/exportUtils';

// --- DATA FROM APP ---
const INITIAL_USERS = [
    { id: '1', name: 'Sanjay Kumar', phone: '+91 9876543210', role: 'WORKER', type: 'Cook / Helper', status: 'ACTIVE', verified: true, joined: '2026-03-01' },
    { id: '2', name: 'Riya Arora', phone: '+91 9123456780', role: 'WORKER', type: 'Service Staff', status: 'ACTIVE', verified: false, joined: '2026-03-05' },
    { id: '3', name: 'Taj Grand Hotel', phone: '+91 8888888888', role: 'HIRER', type: 'Restaurant/Hotel', status: 'PENDING', verified: false, joined: '2026-03-10' },
    { id: '4', name: 'Spice Kitchen', phone: '+91 7777777777', role: 'HIRER', type: 'Catering', status: 'REJECTED', verified: false, joined: '2026-02-15' },
    { id: '5', name: 'Mani K', phone: '+91 9999999999', role: 'WORKER', type: 'Cleaner', status: 'SUSPENDED', verified: true, joined: '2026-01-20' },
];

export default function Users() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('ALL');
    const [users, setUsers] = useState(INITIAL_USERS);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) setSearchQuery(q);
    }, [searchParams]);

    // Modal State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete/ban "${name}"?`)) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const handleVerify = (id: string, name: string) => {
        if (window.confirm(`Approve verification for "${name}"?`)) {
            setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: true, status: 'ACTIVE' } : u));
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesTab = activeTab === 'ALL' || user.role === activeTab;
        const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        return matchesTab && matchesStatus && (user.name.toLowerCase().includes(searchLower) || user.phone.includes(searchLower));
    });

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="text-h2" style={{ marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Partners & Members</h1>
                    <p className="text-muted">Direct management of workers, employers, and system administrators.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ gap: '0.625rem' }} onClick={() => downloadCSV(filteredUsers, 'users')}>
                        <Download size={18} /> Export
                    </button>
                    <button className="btn btn-primary" style={{ gap: '0.625rem' }} onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={18} /> Register Worker
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['ALL', 'WORKER', 'HIRER'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none', border: 'none', fontWeight: 600, padding: '0.75rem 0.5rem', cursor: 'pointer',
                            color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '3px solid var(--accent-primary)' : '3px solid transparent',
                            marginBottom: '-1px', transition: 'all 0.2s', fontSize: '0.935rem'
                        }}
                    >
                        {tab === 'ALL' ? 'Everything' : tab === 'WORKER' ? 'Workers' : 'Employers'}
                    </button>
                ))}
            </div>

            <div className="table-container">
                <div className="table-header" style={{ padding: '1.25rem 2rem', background: 'rgba(var(--text-secondary), 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div className="search-wrapper">
                        <div className="search-bar" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, identifier, or contact..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
                        <select
                            className="input-control"
                            style={{ paddingLeft: '2.5rem', width: '200px', borderRadius: '10px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PENDING">Pending Approval</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Identity</th>
                                <th>Classification</th>
                                <th>Verification</th>
                                <th>Registration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="avatar" style={{
                                                width: 42, height: 42, fontSize: '0.935rem',
                                                backgroundColor: user.role === 'HIRER' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                                color: user.role === 'HIRER' ? 'var(--success)' : 'var(--accent-primary)',
                                                border: 'none', fontWeight: 700
                                            }}>
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{user.name}</div>
                                                <div style={{ fontSize: '0.815rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={10} /> {user.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ marginBottom: '0.4rem' }}>
                                            <span className={`badge ${user.role === 'HIRER' ? 'warning' : 'primary'}`} style={{ textTransform: 'capitalize' }}>
                                                {user.role.toLowerCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.type}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                                            <span className={`badge ${user.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                                                {user.status.toLowerCase()}
                                            </span>
                                            {user.verified ? (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                                    <CheckCircle size={10} /> KYC Verified
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                                    <ShieldAlert size={10} /> Pending KYC
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.joined}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" title="Edit Profile" onClick={() => setEditingUser(user)}>
                                                <Edit2 size={18} />
                                            </button>
                                            {user.role === 'HIRER' && !user.verified && (
                                                <button className="btn-icon" style={{ color: 'var(--success)' }} title="Verify Identity" onClick={() => handleVerify(user.id, user.name)}>
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button className="btn-icon" style={{ color: 'var(--danger)' }} title="Restrict Access" onClick={() => handleDelete(user.id, user.name)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Addition Modal Placeholder */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                    <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quick Registration</h2>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>UI enhancements in progress. Registration logic is currently being optimized for the new theme.</p>
                        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(false)}>Understood</button>
                    </div>
                </div>
            )}

            {/* Edit Modal Placeholder */}
            {editingUser && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                    <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Modify Profile: {editingUser.name}</h2>
                            <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Account modifications for <b>{editingUser.name}</b> can be performed here. Updated UI for settings coming soon.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Save Changes</button>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
