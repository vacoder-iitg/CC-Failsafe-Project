import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TakeAction from './dashboard/TakeAction';
import Notifications from './dashboard/Notifications';
import TeacherDashboard from './dashboard/TeacherDashboard';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classInsights, setClassInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);
    
    // UI States
    const [activePage, setActivePage] = useState(() => localStorage.getItem('failsafe_page') || 'dashboard');

    useEffect(() => { localStorage.setItem('failsafe_page', activePage); }, [activePage]);

    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem('failsafe_notifications');
            if (saved) return JSON.parse(saved).map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        } catch (e) {}
        return [];
    });
    const [completedActions, setCompletedActions] = useState(() => {
        try {
            const saved = localStorage.getItem('failsafe_completed');
            if (saved) return new Set(JSON.parse(saved));
        } catch (e) {}
        return new Set();
    });

    useEffect(() => {
        localStorage.setItem('failsafe_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('failsafe_completed', JSON.stringify([...completedActions]));
    }, [completedActions]);

    const markActionDone = (studentId, studentName, actionLabel, actionDesc, actionIdx) => {
        const key = `${studentId}_${actionIdx}`;
        if (completedActions.has(key)) return;
        setCompletedActions(prev => new Set(prev).add(key));
        setNotifications(prev => [{
            id: Date.now(),
            studentName,
            actionLabel,
            actionDesc,
            facultyName: user?.username || 'Unknown',
            timestamp: new Date(),
            read: false
        }, ...prev]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const fetchStudents = () => {
        setLoading(true);
        fetch('http://localhost:8000/students/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user?.token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Server error');
                return res.json();
            })
            .then(data => {
                setStudents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        setLoadingInsights(true);
        fetch('http://localhost:8000/class/insights', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user?.token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setClassInsights(data);
                setLoadingInsights(false);
            })
            .catch(err => {
                console.error("Failed to fetch class insights:", err);
                setLoadingInsights(false);
            });
    };

    useEffect(() => { 
        if (user) fetchStudents(); 
    }, [user]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

            {/* ─── Vertical Sidebar ─── */}
            <div style={{
                width: '220px', flexShrink: 0,
                background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, height: '100vh',
                boxShadow: '2px 0 16px rgba(0,0,0,0.15)'
            }}>
                {/* Brand */}
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#818cf8,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '19px', color: 'white' }}>school</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', letterSpacing: '0.02em' }}>FAILSAFE</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>Teacher Portal</div>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav style={{ flex: 1, padding: '16px 10px' }}>
                    {[
                        { key: 'dashboard',   icon: 'dashboard',   label: 'Dashboard' },
                        { key: 'takeaction',  icon: 'bolt',        label: 'Take Action' },
                        { key: 'notifications', icon: 'notifications', label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActivePage(item.key)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
                                padding: '11px 14px', marginBottom: '4px',
                                background: activePage === item.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                                border: activePage === item.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                                borderRadius: '9px', cursor: 'pointer',
                                color: activePage === item.key ? 'white' : 'rgba(255,255,255,0.55)',
                                fontWeight: activePage === item.key ? '700' : '500',
                                fontSize: '14px', textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { if (activePage !== item.key) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={e => { if (activePage !== item.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                            {item.label}
                            {item.badge && (
                                <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', borderRadius: '9999px', padding: '1px 7px', minWidth: '18px', textAlign: 'center' }}>
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Teacher + Logout */}
                <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'white' }}>person</span>
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>{user?.username || 'Teacher'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Faculty</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            padding: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px', cursor: 'pointer', color: '#fca5a5', fontWeight: '600', fontSize: '12px',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                        Logout
                    </button>
                </div>
            </div>

            {/* ─── Main Content Area ─── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {activePage === 'takeaction' && (
                    <TakeAction 
                        students={students} 
                        loading={loading} 
                        completedActions={completedActions} 
                        markActionDone={markActionDone} 
                    />
                )}
                {activePage === 'notifications' && (
                    <Notifications 
                        notifications={notifications} 
                        unreadCount={unreadCount} 
                        markAllRead={markAllRead} 
                        user={user} 
                    />
                )}
                {activePage === 'dashboard' && (
                    <TeacherDashboard 
                        students={students} 
                        loading={loading} 
                        classInsights={classInsights} 
                        loadingInsights={loadingInsights} 
                        fetchStudents={fetchStudents} 
                        user={user} 
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
