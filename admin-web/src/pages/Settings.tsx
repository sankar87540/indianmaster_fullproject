import { useState } from 'react';
import {
    User, Shield, Bell, Settings as SettingsIcon, Save, Key,
    Mail, Smartphone, Globe, CreditCard, Laptop, Database,
    ChevronRight, ExternalLink
} from 'lucide-react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('PROFILE');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Settings synchronized with secure cloud storage!");
    };

    const tabs = [
        { id: 'PROFILE', label: 'Admin Profile', icon: <User size={18} />, description: 'Personal info & avatars' },
        { id: 'SECURITY', label: 'Security', icon: <Shield size={18} />, description: 'Password & 2-Step verification' },
        { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={18} />, description: 'Platform & email alerts' },
        { id: 'PREFERENCES', label: 'Preferences', icon: <SettingsIcon size={18} />, description: 'Locale & language settings' },
    ];

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="text-h2" style={{ marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Platform Management</h1>
                    <p className="text-muted">Configure admin credentials, security protocols, and global system preferences.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
                {/* Modern Sidebar Navigation */}
                <div style={{ flex: '0 0 320px' }}>
                    <div className="table-container" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ padding: '1rem 0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontWeight: 700 }}>Configuration Menu</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        width: '100%',
                                        padding: '1rem',
                                        background: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-primary)',
                                        color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 0.3s'
                                    }}>
                                        {tab.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.935rem' }}>{tab.label}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{tab.description}</div>
                                    </div>
                                    {activeTab === tab.id && <ChevronRight size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick System Info Card */}
                    <div className="stat-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div className="stat-icon" style={{ width: 32, height: 32, fontSize: '1rem', background: 'rgba(var(--success), 0.1)', color: 'var(--success)' }}>
                                <Database size={16} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Server Status</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Region</span>
                            <span style={{ fontWeight: 600 }}>Mumbai (ap-south-1)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.815rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Version</span>
                            <span style={{ fontWeight: 600 }}>v4.8.2-stable</span>
                        </div>
                    </div>
                </div>

                {/* Sub-page Content */}
                <div style={{ flex: 1 }}>
                    <div className="table-container" style={{ padding: '0' }}>
                        <div style={{ padding: '2rem 2.5rem', background: 'rgba(var(--text-secondary), 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.935rem', marginTop: '0.25rem' }}>
                                Details and configuration for the selected module.
                            </p>
                        </div>

                        <div style={{ padding: '2.5rem' }}>
                            <form onSubmit={handleSave}>
                                {/* Profile Tab Content */}
                                {activeTab === 'PROFILE' && (
                                    <div className="animate-slide-up">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div className="avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', border: '4px solid var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>AD</div>
                                                <button type="button" style={{ position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', border: '2px solid var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Save size={14} />
                                                </button>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Administrator Primary Alias</h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Update your identity and contact details visible to other staff.</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div className="input-group">
                                                <label>Display Name</label>
                                                <div className="input-with-icon">
                                                    <User className="input-icon" size={18} />
                                                    <input type="text" className="input-control" defaultValue="Sanjay Admin" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Privilege Level</label>
                                                <input type="text" className="input-control" defaultValue="Full Superuser Access" disabled />
                                            </div>
                                            <div className="input-group">
                                                <label>Direct Email Address</label>
                                                <div className="input-with-icon">
                                                    <Mail className="input-icon" size={18} />
                                                    <input type="email" className="input-control" defaultValue="admin@indianmaster.in" />
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Contact Number (Mobile)</label>
                                                <div className="input-with-icon">
                                                    <Smartphone className="input-icon" size={18} />
                                                    <input type="text" className="input-control" defaultValue="+91 9876543210" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Security Tab Content */}
                                {activeTab === 'SECURITY' && (
                                    <div className="animate-slide-up">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Credential Update</h3>
                                                <div className="input-group">
                                                    <label>Authorized Current Password</label>
                                                    <input type="password" className="input-control" placeholder="••••••••••••" />
                                                </div>
                                                <div className="input-group">
                                                    <label>New Secure Password</label>
                                                    <input type="password" className="input-control" placeholder="Min. 12 characters" />
                                                </div>
                                                <div className="input-group">
                                                    <label>Verify New Credentials</label>
                                                    <input type="password" className="input-control" placeholder="Re-enter password" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Access Safeguards</h3>
                                                <div className="glass" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-light)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                        <Key size={20} color="var(--accent-primary)" />
                                                        <strong style={{ fontSize: '1rem' }}>Multi-Factor Authentication</strong>
                                                    </div>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                                        Secure your administrative access with an additional TOTP (Time-based One-Time Password) challenge.
                                                    </p>
                                                    <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert("Initializing 2FA setup...")}>
                                                        Configure 2FA Protocols
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notifications Tab Content */}
                                {activeTab === 'NOTIFICATIONS' && (
                                    <div className="animate-slide-up">
                                        <div style={{ maxWidth: '600px' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Dispatch Preferences</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {[
                                                    { title: "Registration Webhooks", desc: "Receive real-time alerts when new worker/hirer enters the system." },
                                                    { title: "Verification Queues", desc: "Aggregated notifications for PENDING identity documents." },
                                                    { title: "Analytical Snapshots", desc: "Weekly summaries of platform growth and engagement metrics." },
                                                    { title: "System Anomalies", desc: "Critical security logs and unauthorized access attempts." }
                                                ].map((item, idx) => (
                                                    <label key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '1.25rem',
                                                        padding: '1.25rem',
                                                        background: 'var(--bg-primary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', marginTop: '3px' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.935rem' }}>{item.title}</div>
                                                            <div style={{ fontSize: '0.815rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Preferences Tab Content */}
                                {activeTab === 'PREFERENCES' && (
                                    <div className="animate-slide-up" style={{ maxWidth: '600px' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Internationalization & Region</h3>

                                        <div className="input-group">
                                            <label>System Localization (Language)</label>
                                            <div className="input-with-icon">
                                                <Globe className="input-icon" size={18} />
                                                <select className="input-control" defaultValue="en">
                                                    <option value="en">Global (English)</option>
                                                    <option value="ta">Tamil (தமிழ்)</option>
                                                    <option value="hi">Hindi (हिंदी)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <label>Temporal Reference (Timezone)</label>
                                            <select className="input-control" defaultValue="ist">
                                                <option value="ist">India Standard Time (IST) - New Delhi [UTC+5:30]</option>
                                                <option value="utc">Universal Coordinated (UTC) [GMT+0]</option>
                                            </select>
                                        </div>

                                        <div className="input-group">
                                            <label>Financial Logic (Primary Currency)</label>
                                            <div className="input-with-icon">
                                                <CreditCard className="input-icon" size={18} />
                                                <select className="input-control" defaultValue="inr">
                                                    <option value="inr">Indian State Rupee (₹)</option>
                                                    <option value="usd">United States Dollar ($)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 3rem' }}>
                                        <Save size={20} /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
