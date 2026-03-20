import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { session } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (session) {
            navigate('/');
        }
    }, [session, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Try Supabase auth first
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Check for dummy fallback credential
            if (email === 'admin@example.com' && password === '12345678') {
                // If dummy auth passes, navigate directly. We bypass Supabase context.
                setLoading(false);
                navigate('/');
            } else {
                setErrorMsg(error.message + ' (Or use admin@example.com / 12345678 as a fallback to test)');
                setLoading(false);
            }
        } else {
            // Success triggers AuthContext listener which re-renders App and PrivateRoute
            navigate('/');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card" style={{ padding: '3.5rem', maxWidth: '440px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ height: '100px', width: 'auto', marginBottom: '1.5rem', overflow: 'hidden' }}>
                        <img src="/logo.png" alt="Indian Master Logo" className="logo-glow" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <p className="text-muted" style={{ fontWeight: 500, marginTop: '0.25rem' }}>Administration Access Panel</p>
                </div>

                {errorMsg && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="email"
                                id="email"
                                className="input-control"
                                placeholder="admin@example.com"
                                style={{ paddingLeft: '2.5rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                id="password"
                                className="input-control"
                                placeholder="••••••••"
                                style={{ paddingLeft: '2.5rem' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
