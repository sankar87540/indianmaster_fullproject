import { useState } from 'react';
import { Search, Filter, Eye, PauseCircle, PlayCircle, CheckCircle, Trash2, X, Download, MapPin, IndianRupee, Users } from 'lucide-react';
import { downloadCSV } from '../lib/exportUtils';

const INITIAL_JOBS = [
    { id: '101', title: 'Head Chef', hirer: 'Taj Grand Hotel', location: 'Chennai, TN', salary: '₹40,000/mo', applicants: 12, status: 'ACTIVE', posted: '2026-03-08' },
    { id: '102', title: 'Waitress', hirer: 'Spice Kitchen', location: 'Bengaluru, KA', salary: '₹15,000/mo', applicants: 45, status: 'PAUSED', posted: '2026-02-28' },
    { id: '103', title: 'Restaurant Manager', hirer: 'Cloud 9 RestoBar', location: 'Mumbai, MH', salary: '₹55,000/mo', applicants: 0, status: 'PENDING_APPROVAL', posted: '2026-03-11' },
    { id: '104', title: 'Cleaner', hirer: 'A2B Foods', location: 'Madurai, TN', salary: '₹12,000/mo', applicants: 89, status: 'ACTIVE', posted: '2026-01-10' },
    { id: '105', title: 'Bartender', hirer: 'The Social', location: 'Goa', salary: '₹30,000/mo', applicants: 4, status: 'CLOSED', posted: '2025-12-05' },
];

export default function Jobs() {
    const [activeTab, setActiveTab] = useState('ALL');
    const [jobs, setJobs] = useState(INITIAL_JOBS);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // View Details Modal State
    const [selectedJob, setSelectedJob] = useState<any>(null);

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to permanently delete the job posting "${title}"?`)) {
            setJobs(prev => prev.filter(j => j.id !== id));
        }
    };

    const handleApprove = (id: string, title: string) => {
        if (window.confirm(`Approve job posting "${title}"? It will go live immediately.`)) {
            setJobs(prev => prev.map(j =>
                j.id === id ? { ...j, status: 'ACTIVE' } : j
            ));
        }
    };

    const handlePause = (id: string, title: string) => {
        if (window.confirm(`Pause job posting "${title}"? It will be hidden from workers.`)) {
            setJobs(prev => prev.map(j =>
                j.id === id ? { ...j, status: 'PAUSED' } : j
            ));
        }
    };

    const handleResume = (id: string, title: string) => {
        if (window.confirm(`Resume job posting "${title}"? It will become active again.`)) {
            setJobs(prev => prev.map(j =>
                j.id === id ? { ...j, status: 'ACTIVE' } : j
            ));
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesTab = activeTab === 'ALL' || (activeTab === job.status) || (activeTab === 'ACTIVE' && job.status === 'ACTIVE');
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = job.title.toLowerCase().includes(searchLower) || job.hirer.toLowerCase().includes(searchLower);
        return matchesTab && matchesStatus && matchesSearch;
    });

    const handleDownloadReport = () => {
        downloadCSV(filteredJobs, `jobs_report_${activeTab}_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 className="text-h2" style={{ marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>Job Postings</h1>
                    <p className="text-muted">Review, approve, and manage all job advertisements across the platform.</p>
                </div>
                <button className="btn btn-outline" style={{ gap: '0.625rem' }} onClick={handleDownloadReport}>
                    <Download size={18} /> Export CSV
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                {['ALL', 'PENDING_APPROVAL', 'ACTIVE'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontWeight: 600,
                            padding: '0.75rem 0.5rem',
                            cursor: 'pointer',
                            color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '3px solid var(--accent-primary)' : '3px solid transparent',
                            marginBottom: '-1px',
                            transition: 'all 0.2s',
                            fontSize: '0.935rem'
                        }}
                    >
                        {tab === 'ALL' ? 'All Postings' : tab === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Active Jobs'}
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
                                placeholder="Search by job title or organization..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
                        <select
                            className="input-control"
                            style={{ paddingLeft: '2.5rem', width: '220px', borderRadius: '10px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active / Live</option>
                            <option value="PENDING_APPROVAL">Pending Approval</option>
                            <option value="PAUSED">Paused</option>
                            <option value="CLOSED">Closed/Expired</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Job Role & Market</th>
                                <th>Employer / Hirer</th>
                                <th>Status</th>
                                <th>Engagement</th>
                                <th>Administrative</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.4rem' }}>{job.title}</div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.815rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {job.location}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IndianRupee size={12} /> {job.salary}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.hirer}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Posted: {job.posted}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${job.status === 'ACTIVE' ? 'success' : job.status === 'PENDING_APPROVAL' ? 'warning' : job.status === 'PAUSED' ? 'primary' : 'danger'}`}>
                                            <span style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                backgroundColor: job.status === 'ACTIVE' ? 'var(--success)' : job.status === 'PENDING_APPROVAL' ? 'var(--warning)' : 'var(--text-secondary)',
                                                marginRight: '8px'
                                            }}></span>
                                            {job.status.replace('_', ' ').toLowerCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{job.applicants}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Applications</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" title="View Full Posting" onClick={() => setSelectedJob(job)}>
                                                <Eye size={18} />
                                            </button>

                                            {job.status === 'PENDING_APPROVAL' && (
                                                <button className="btn-icon" style={{ color: 'var(--success)' }} title="Approve Job" onClick={() => handleApprove(job.id, job.title)}>
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}

                                            {job.status === 'ACTIVE' && (
                                                <button className="btn-icon" style={{ color: 'var(--warning)' }} title="Pause Job" onClick={() => handlePause(job.id, job.title)}>
                                                    <PauseCircle size={18} />
                                                </button>
                                            )}

                                            {job.status === 'PAUSED' && (
                                                <button className="btn-icon" style={{ color: 'var(--success)' }} title="Resume Job" onClick={() => handleResume(job.id, job.title)}>
                                                    <PlayCircle size={18} />
                                                </button>
                                            )}

                                            <button className="btn-icon" style={{ color: 'var(--danger)' }} title="Remove Permanently" onClick={() => handleDelete(job.id, job.title)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredJobs.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Briefcase size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>No job postings found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* View Job Details Modal */}
            {selectedJob && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(12px)', animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="glass" style={{
                        padding: '3rem', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '550px', boxShadow: 'var(--shadow-lg)',
                        position: 'relative'
                    }}>
                        <button onClick={() => setSelectedJob(null)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <span className={`badge ${selectedJob.status === 'ACTIVE' ? 'success' : 'warning'}`} style={{ marginBottom: '1rem' }}>
                                {selectedJob.status.replace('_', ' ')}
                            </span>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{selectedJob.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                <Users size={18} /> {selectedJob.hirer}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div>
                                <p style={{ fontSize: '0.815rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Location</p>
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedJob.location}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.815rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Salary Bracket</p>
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedJob.salary}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.815rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Publication Date</p>
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedJob.posted}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.815rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Platform Engagement</p>
                                <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedJob.applicants} Applications</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                            {selectedJob.status === 'PENDING_APPROVAL' && (
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { handleApprove(selectedJob.id, selectedJob.title); setSelectedJob(null); }}>
                                    Approve & Go Live
                                </button>
                            )}

                            {selectedJob.status === 'ACTIVE' && (
                                <button className="btn btn-outline" style={{ flex: 1, color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => { handlePause(selectedJob.id, selectedJob.title); setSelectedJob(null); }}>
                                    Pause Recruitment
                                </button>
                            )}

                            {selectedJob.status === 'PAUSED' && (
                                <button className="btn btn-outline" style={{ flex: 1, color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => { handleResume(selectedJob.id, selectedJob.title); setSelectedJob(null); }}>
                                    Resume Recruitment
                                </button>
                            )}

                            <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { handleDelete(selectedJob.id, selectedJob.title); setSelectedJob(null); }}>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
