import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, signup } = useContext(AuthContext);

    const [isLoginMode, setIsLoginMode] = useState(location.state?.mode !== 'signup');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('Teacher');

    useEffect(() => {
        if (location.state?.mode === 'signup') {
            setIsLoginMode(false);
        } else if (location.state?.mode === 'login') {
            setIsLoginMode(true);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLoginMode) {
                await login(username, password, role);
            } else {
                await signup(username, password, role);
            }
            if (role === 'HoD') {
                navigate('/hod');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isHod = role === 'HoD';
    const primaryColor = isHod ? '#f59e0b' : '#6366f1';
    const gradient = isHod
        ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
        : 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)';
    const logoIcon = isHod ? 'shield_person' : 'school';

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            backgroundImage: 'url("auth-bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: '20px'
        }}>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '48px 40px',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                width: '100%',
                maxWidth: '420px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
                position: 'relative'
            }}>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#1e293b'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Back
                </button>


                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: `0 10px 25px ${isHod ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'white' }}>
                            {logoIcon}
                        </span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: '30px', color: '#1e293b', fontWeight: '900', letterSpacing: '-0.04em' }}>
                        FAILSAFE
                    </h1>
                    <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '15px', fontWeight: '500' }}>
                        {isLoginMode ? `Secure ${role} Access` : `Create ${role} Account`}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.05)',
                    padding: '4px',
                    borderRadius: '14px',
                    marginBottom: '32px'
                }}>
                    {['Faculty', 'HoD'].map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: role === r ? 'white' : 'transparent',
                                color: role === r ? '#0f172a' : '#64748b',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '14px',
                                boxShadow: role === r ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(225, 29, 72, 0.1)',
                        color: '#e11d48',
                        padding: '14px',
                        borderRadius: '14px',
                        marginBottom: '24px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '1px solid rgba(225, 29, 72, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '13px', fontWeight: '700', marginLeft: '4px' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '20px' }}>person</span>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                style={{
                                    width: '100%',
                                    padding: '14px 14px 14px 44px',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    fontSize: '15px',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.backgroundColor = 'white'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.5)'; }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontSize: '13px', fontWeight: '700', marginLeft: '4px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '20px' }}>lock</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px 14px 14px 44px',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    fontSize: '15px',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.backgroundColor = 'white'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.5)'; }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            marginTop: '10px',
                            background: gradient,
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '16px',
                            boxShadow: `0 12px 20px -5px ${isHod ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.4)'}`,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.95'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? 'Processing...' : (isLoginMode ? 'Secure Login' : 'Create Account')}
                    </button>
                </form>

                <div style={{ marginTop: '32px' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        <span
                            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                            style={{
                                color: primaryColor,
                                cursor: 'pointer',
                                fontWeight: '800',
                                marginLeft: '6px',
                                textDecoration: 'underline',
                                textUnderlineOffset: '4px'
                            }}>
                            {isLoginMode ? 'Sign Up' : 'Log In'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
