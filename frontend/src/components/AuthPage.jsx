import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Adjust path if your folder structure is different

const AuthPage = () => {
    const { login, signup } = useContext(AuthContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('Faculty');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLoginMode) {
                await login(username, password);
            } else {
                await signup(username, password, role);
            }
        } catch (err) {
            // This catches the beautiful custom errors from FastAPI!
            setError(err.message); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', color: '#1f2937', marginBottom: '10px' }}>FAILSAFE Engine</h1>
                <h3 style={{ textAlign: 'center', color: '#6b7280', marginTop: 0, marginBottom: '30px', fontWeight: 'normal' }}>
                    {isLoginMode ? 'Sign in to access your secure vault' : 'Create a new faculty account'}
                </h3>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #fca5a5' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px', fontWeight: 'bold' }}>Username</label>
                        <input 
                            type="text" 
                            required
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            style={{ width: '93%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px', fontWeight: 'bold' }}>Password</label>
                        <input 
                            type="password" 
                            required
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            style={{ width: '93%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                    </div>
                    
                    {!isLoginMode && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#374151', fontSize: '14px', fontWeight: 'bold' }}>Role</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Faculty', 'HoD'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '6px',
                                            border: role === r ? '2px solid #2563eb' : '1px solid #d1d5db',
                                            backgroundColor: role === r ? '#eff6ff' : 'white',
                                            color: role === r ? '#2563eb' : '#6b7280',
                                            fontWeight: role === r ? 'bold' : 'normal',
                                            cursor: 'pointer', fontSize: '14px'
                                        }}
                                    >
                                        {r === 'HoD' ? 'Head of Department' : 'Faculty'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ padding: '12px', marginTop: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                        {loading ? 'Processing...' : (isLoginMode ? 'Secure Login' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                        <span 
                            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} 
                            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isLoginMode ? 'Sign Up' : 'Log In'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;