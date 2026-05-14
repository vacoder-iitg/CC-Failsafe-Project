import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Overview from './hod_dashboard/Overview';
import TeacherData from './hod_dashboard/TeacherData';
import ActionsLog from './hod_dashboard/ActionsLog';

const HodDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(() => localStorage.getItem('hod_page') || 'overview');

    useEffect(() => { localStorage.setItem('hod_page', activePage); }, [activePage]);

    // Read all teacher notifications from localStorage
    const getAllNotifications = () => {
        try {
            const saved = localStorage.getItem('failsafe_notifications');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    };

    useEffect(() => {
        if (!user) return;
        fetch('http://localhost:8000/hod/overview', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [user]);

    const agg = data?.aggregate || {};
    const teachers = data?.teachers || [];
    const allNotifs = getAllNotifications();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
            {/* Sidebar */}
            <div style={{ width: '220px', flexShrink: 0, background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', boxShadow: '2px 0 16px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: 'white' }}>shield_person</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>FAILSAFE</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>HoD Portal</div>
                        </div>
                    </div>
                </div>
                <nav style={{ flex: 1, padding: '16px 10px' }}>
                    {[
                        { key: 'overview', icon: 'monitoring', label: 'Overview' },
                        { key: 'teacher', icon: 'groups', label: 'Teacher Data' },
                        { key: 'actions', icon: 'task_alt', label: 'Actions Log' },
                    ].map(item => (
                        <button key={item.key} onClick={() => setActivePage(item.key)} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
                            padding: '11px 14px', marginBottom: '4px',
                            background: activePage === item.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                            border: activePage === item.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                            borderRadius: '9px', cursor: 'pointer',
                            color: activePage === item.key ? 'white' : 'rgba(255,255,255,0.55)',
                            fontWeight: activePage === item.key ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'all 0.15s'
                        }}
                            onMouseEnter={e => { if (activePage !== item.key) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={e => { if (activePage !== item.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'white' }}>person</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>{user?.username || 'HoD'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Head of Dept.</div>
                        </div>
                    </div>
                    <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', color: '#fca5a5', fontWeight: '600', fontSize: '12px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ 
                flex: 1, 
                minWidth: 0,
                backgroundImage: 'url("/auth-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                minHeight: '100vh'
            }}>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>Loading department data...</div>
                ) : (
                    <>
                        {/* === OVERVIEW PAGE === */}
                        {activePage === 'overview' && <Overview agg={agg} facultyList={teachers} />}

                        {/* === TEACHER DATA PAGE === */}
                        {activePage === 'teacher' && <TeacherData facultyList={teachers} user={user} />}

                        {/* === ACTIONS LOG PAGE === */}
                        {activePage === 'actions' && <ActionsLog allNotifs={allNotifs} />}
                    </>
                )}
            </div>
        </div>
    );
};

export default HodDashboard;