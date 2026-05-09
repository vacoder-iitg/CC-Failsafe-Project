import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CsvUpload from './CsvUpload';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [classInsights, setClassInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(true);
    
    // UI States
    const [sortOrder, setSortOrder] = useState('highest');
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('failsafe_tab') || 'overview');
    const [activePage, setActivePage] = useState(() => localStorage.getItem('failsafe_page') || 'dashboard');
    const [expandedStudent, setExpandedStudent] = useState(null);

    useEffect(() => { localStorage.setItem('failsafe_tab', activeTab); }, [activeTab]);
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


    // Generate actionable recommendations from student data
    const getStudentActions = (s) => {
        const actions = [];
        // Academic performance
        if (s.G1 !== undefined && s.G1 < 10)
            actions.push({ icon: 'menu_book', color: '#ef4444', bg: '#fef2f2', label: 'Low G1 Score', desc: 'Provide personal tutor for weak subjects', priority: 'high' });
        if (s.G2 !== undefined && s.G2 < 10)
            actions.push({ icon: 'menu_book', color: '#ef4444', bg: '#fef2f2', label: 'Low G2 Score', desc: 'Assign remedial classes & practice tests', priority: 'high' });
        if (s.failures && s.failures >= 1)
            actions.push({ icon: 'school', color: '#dc2626', bg: '#fef2f2', label: `${s.failures} Past Failure(s)`, desc: 'Enroll in academic recovery program', priority: 'high' });
        // Study habits
        if (s.studytime !== undefined && s.studytime <= 1)
            actions.push({ icon: 'schedule', color: '#f59e0b', bg: '#fffbeb', label: 'Very Low Study Time', desc: 'Provide supervised extra study hours in school', priority: 'medium' });
        // Attendance
        if (s.absences !== undefined && s.absences > 10)
            actions.push({ icon: 'event_busy', color: '#ef4444', bg: '#fef2f2', label: `High Absences (${s.absences})`, desc: 'Formal warning to student & parents about attendance policy', priority: 'high' });
        else if (s.absences !== undefined && s.absences > 5)
            actions.push({ icon: 'event_busy', color: '#f59e0b', bg: '#fffbeb', label: `Moderate Absences (${s.absences})`, desc: 'Counsel student about attendance importance', priority: 'medium' });
        // Health
        if (s.health !== undefined && s.health <= 2)
            actions.push({ icon: 'local_hospital', color: '#ef4444', bg: '#fef2f2', label: 'Health Concerns', desc: 'Recommend consultation with school doctor', priority: 'high' });
        // Alcohol
        if ((s.Dalc && s.Dalc >= 3) || (s.Walc && s.Walc >= 3))
            actions.push({ icon: 'no_drinks', color: '#dc2626', bg: '#fef2f2', label: 'High Alcohol Consumption', desc: 'Refer to school counselor for substance awareness', priority: 'high' });
        // Social / Lifestyle
        if (s.goout !== undefined && s.goout >= 4)
            actions.push({ icon: 'groups', color: '#f59e0b', bg: '#fffbeb', label: 'High Social Activity', desc: 'Monitor social time, suggest balanced routine', priority: 'low' });
        if (s.freetime !== undefined && s.freetime >= 4)
            actions.push({ icon: 'sports_esports', color: '#6b7280', bg: '#f9fafb', label: 'Excessive Free Time', desc: 'Encourage extracurricular/academic engagement', priority: 'low' });
        // Support gaps
        if (s.famsup === 'no')
            actions.push({ icon: 'family_restroom', color: '#8b5cf6', bg: '#f5f3ff', label: 'No Family Support', desc: 'Schedule parent-teacher meeting to engage family', priority: 'medium' });
        if (s.schoolsup === 'no' && (s.G1 < 10 || s.G2 < 10))
            actions.push({ icon: 'support_agent', color: '#3b82f6', bg: '#eff6ff', label: 'No School Support', desc: 'Enroll in school academic support program', priority: 'medium' });
        if (s.higher === 'no')
            actions.push({ icon: 'trending_up', color: '#6366f1', bg: '#eef2ff', label: 'No Higher Ed. Aspiration', desc: 'Provide career guidance & motivational counseling', priority: 'medium' });
        if (s.romantic === 'yes' && s.studytime <= 2)
            actions.push({ icon: 'favorite', color: '#ec4899', bg: '#fdf2f8', label: 'Relationship + Low Study', desc: 'Time management workshop', priority: 'low' });
        // Parental education
        if ((s.Medu !== undefined && s.Medu <= 1) && (s.Fedu !== undefined && s.Fedu <= 1))
            actions.push({ icon: 'escalator_warning', color: '#6b7280', bg: '#f9fafb', label: 'Low Parental Education', desc: 'Additional mentorship from senior students/teachers', priority: 'low' });

        if (actions.length === 0)
            actions.push({ icon: 'check_circle', color: '#10b981', bg: '#ecfdf5', label: 'No Major Concerns', desc: 'Student appears on track — continue monitoring', priority: 'ok' });

        return actions;
    };


    // Trend chart lazy-load state
    const [activeTrend, setActiveTrend] = useState(null);   // key of expanded metric
    const [trendPlots, setTrendPlots] = useState({});        // cache: key -> base64
    const [trendLoading, setTrendLoading] = useState(null);  // key currently fetching

    // Decision plot interactive state
    const [dpMode, setDpMode] = useState('all');
    const [dpStudentInput, setDpStudentInput] = useState('');
    const [dpCache, setDpCache] = useState({});       // cacheKey -> { plot, title, count }
    const [dpLoading, setDpLoading] = useState(false);
    const [dpError, setDpError] = useState('');

    const fetchDecisionPlot = (mode, studentNum, token) => {
        const cacheKey = mode === 'student' ? `student_${studentNum}` : mode;
        if (dpCache[cacheKey]) { setDpMode(mode); setDpError(''); return; }
        setDpMode(mode);
        setDpLoading(true);
        setDpError('');
        const params = mode === 'student' ? `?mode=student&student_num=${studentNum}` : `?mode=${mode}`;
        fetch(`http://localhost:8000/class/decision-plot${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.plot) setDpError(data.title || 'No data returned');
                else setDpCache(prev => ({ ...prev, [cacheKey]: data }));
                setDpLoading(false);
            })
            .catch(() => { setDpError('Failed to fetch decision plot'); setDpLoading(false); });
    };


    const handleTrendToggle = (key, token) => {
        if (activeTrend === key) {
            setActiveTrend(null); // toggle off
            return;
        }
        setActiveTrend(key);
        if (trendPlots[key]) return; // already cached
        setTrendLoading(key);
        fetch(`http://localhost:8000/class/metric-plot/${key}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setTrendPlots(prev => ({ ...prev, [key]: data.plot }));
                setTrendLoading(null);
            })
            .catch(() => setTrendLoading(null));
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

    const sortedStudents = [...students].sort((a, b) => {
        if (sortOrder === 'highest') {
            return b.risk_score - a.risk_score; 
        } else {
            return a.risk_score - b.risk_score; 
        }
    });

    const toggleSort = () => {
        setSortOrder(prev => prev === 'highest' ? 'lowest' : 'highest');
    };

    const thStyle = { padding: '12px 16px', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f3f4f6', fontWeight: 'bold', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

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

            {/* ============= PAGE: TAKE ACTION ============= */}
            {activePage === 'takeaction' && (
                <div style={{ padding: '28px 32px', backgroundColor: '#f8f9ff', minHeight: '100vh' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#6366f1' }}>bolt</span>
                        <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Take Action</h2>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px', maxWidth: '700px' }}>
                        Prioritized action items for each student based on their risk profile. Students are sorted by risk — highest first.
                    </p>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading students...</div>
                    ) : students.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '10px' }}>folder_open</span>
                            <p style={{ color: '#6b7280', margin: 0 }}>No students uploaded yet. Go to Dashboard → Data & Settings.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[...students].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).map(s => {
                                const actions = getStudentActions(s);
                                const isHigh = s.risk_category === 'HIGH';
                                const isMod  = s.risk_category === 'MODERATE';
                                const riskColor = isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#10b981';
                                const riskBg = isHigh ? '#fef2f2' : isMod ? '#fffbeb' : '#ecfdf5';
                                const riskIcon = isHigh ? 'emergency_home' : isMod ? 'warning' : 'check_circle';
                                const highPriorityCount = actions.filter(a => a.priority === 'high').length;
                                const isExpanded = expandedStudent === s.id;

                                return (
                                    <div key={s.id} style={{
                                        backgroundColor: 'white', borderRadius: '10px',
                                        border: '1px solid #e5e7eb', borderLeft: `4px solid ${riskColor}`,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                        overflow: 'hidden', transition: 'box-shadow 0.2s'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'}
                                    >
                                        {/* Student header row — always visible */}
                                        <div
                                            onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '16px',
                                                padding: '14px 20px', cursor: 'pointer',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {/* Name + Risk */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>{s.student_name}</span>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        padding: '3px 10px', borderRadius: '9999px',
                                                        backgroundColor: riskBg, color: riskColor,
                                                        fontSize: '11px', fontWeight: '700'
                                                    }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{riskIcon}</span>
                                                        {s.risk_category || 'UNSCORED'}
                                                    </span>
                                                    {s.risk_score !== undefined && (
                                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>({(s.risk_score * 100).toFixed(1)}%)</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Grade pills */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                                {[{ l: 'G1', v: s.G1 }, { l: 'G2', v: s.G2 }, { l: 'PG3', v: s.predicted_g3 || '—' }].map(g => (
                                                    <div key={g.l} style={{ textAlign: 'center', minWidth: '44px' }}>
                                                        <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{g.l}</div>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: g.l === 'PG3' ? '#2563eb' : '#374151' }}>{g.v}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action count badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                {highPriorityCount > 0 && (
                                                    <span style={{
                                                        backgroundColor: '#ef4444', color: 'white',
                                                        fontSize: '10px', fontWeight: '800',
                                                        borderRadius: '9999px', padding: '2px 8px'
                                                    }}>
                                                        {highPriorityCount} urgent
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                                                    {actions.length} action{actions.length !== 1 ? 's' : ''}
                                                </span>
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                                            </div>
                                        </div>

                                        {/* Expanded action list */}
                                        {isExpanded && (
                                            <div style={{ padding: '0 20px 18px', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '14px' }}>
                                                    {actions.map((a, i) => {
                                                        const doneKey = `${s.id}_${i}`;
                                                        const isDone = completedActions.has(doneKey);
                                                        return (
                                                        <div key={i} style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                                                            padding: '12px 14px', backgroundColor: isDone ? '#f0fdf4' : a.bg,
                                                            borderRadius: '8px', border: `1px solid ${isDone ? '#86efac' : a.color + '22'}`,
                                                            opacity: isDone ? 0.7 : 1, transition: 'all 0.2s'
                                                        }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isDone ? '#10b981' : a.color, flexShrink: 0, marginTop: '1px' }}>{isDone ? 'check_circle' : a.icon}</span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: '700', fontSize: '13px', color: isDone ? '#6b7280' : '#111827', marginBottom: '2px', textDecoration: isDone ? 'line-through' : 'none' }}>{a.label}</div>
                                                                <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>{a.desc}</div>
                                                            </div>
                                                            {!isDone && a.priority !== 'ok' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); markActionDone(s.id, s.student_name, a.label, a.desc, i); }}
                                                                    style={{
                                                                        flexShrink: 0, padding: '4px 10px',
                                                                        backgroundColor: '#10b981', color: 'white',
                                                                        border: 'none', borderRadius: '6px',
                                                                        fontSize: '11px', fontWeight: '700',
                                                                        cursor: 'pointer', whiteSpace: 'nowrap',
                                                                        transition: 'opacity 0.15s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                                >
                                                                    Mark Done
                                                                </button>
                                                            )}
                                                            {isDone && (
                                                                <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: '700', color: '#10b981' }}>Done ✓</span>
                                                            )}
                                                        </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Quick link */}
                                                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/student/${s.id}`); }}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                            padding: '6px 14px', fontSize: '12px', fontWeight: '700',
                                                            color: '#6366f1', backgroundColor: '#eef2ff',
                                                            border: '1px solid #c7d2fe', borderRadius: '7px',
                                                            cursor: 'pointer', transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6366f1'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                                                        Full Student Profile
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============= PAGE: NOTIFICATIONS ============= */}
            {activePage === 'notifications' && (
                <div style={{ padding: '28px 32px', backgroundColor: '#f8f9ff', minHeight: '100vh' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#6366f1' }}>notifications</span>
                            <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Notifications</h2>
                            {notifications.length > 0 && (
                                <span style={{ backgroundColor: '#eef2ff', color: '#6366f1', fontSize: '13px', fontWeight: '700', padding: '2px 10px', borderRadius: '9999px' }}>
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '7px 14px', fontSize: '12px', fontWeight: '600',
                                    color: '#6366f1', backgroundColor: '#eef2ff',
                                    border: '1px solid #c7d2fe', borderRadius: '8px',
                                    cursor: 'pointer', transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6366f1'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eef2ff'; e.currentTarget.style.color = '#6366f1'; }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>done_all</span>
                                Read All
                            </button>
                        )}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                        Actions taken on students are logged here automatically.
                    </p>

                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '10px' }}>notifications_off</span>
                            <p style={{ color: '#9ca3af', margin: 0, fontSize: '15px' }}>No notifications yet.</p>
                            <p style={{ color: '#d1d5db', margin: '6px 0 0', fontSize: '13px' }}>Go to Take Action and mark actions as done to see them here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* HoD Messages */}
                            {(() => {
                                const hodMsgs = JSON.parse(localStorage.getItem('failsafe_hod_messages') || '[]')
                                    .filter(m => m.toFaculty === user?.username);
                                return hodMsgs.length > 0 && (
                                    <>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield_person</span>
                                            Messages from HoD
                                        </div>
                                        {hodMsgs.map(m => (
                                            <div key={m.id} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '14px',
                                                padding: '16px 20px', backgroundColor: '#fffbeb',
                                                borderRadius: '10px', border: '1px solid #fde68a',
                                                borderLeft: '3px solid #f59e0b',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                            }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>shield_person</span>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', color: '#111827' }}>
                                                        <span style={{ fontWeight: '700', color: '#92400e' }}>{m.msgLabel}</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '2px', fontWeight: '600' }}>
                                                        From: {m.fromHod}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#374151', marginTop: '3px' }}>
                                                        {m.msgDesc}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.length > 0 && (
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>task_alt</span>
                                                Your Actions
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                            {notifications.map(n => {
                                return (
                                    <div key={n.id} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '14px',
                                        padding: '16px 20px', backgroundColor: n.read ? '#fafafa' : 'white',
                                        borderRadius: '10px', border: '1px solid #e5e7eb',
                                        borderLeft: n.read ? '3px solid #e5e7eb' : '3px solid #6366f1',
                                        boxShadow: n.read ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                                        opacity: n.read ? 0.75 : 1
                                    }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>check_circle</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', color: '#111827' }}>
                                                <span style={{ fontWeight: '700' }}>Action taken</span> on <span style={{ fontWeight: '700', color: '#6366f1' }}>{n.studentName}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#374151', marginTop: '3px' }}>
                                                <span style={{ fontWeight: '600' }}>{n.actionLabel}</span> — {n.actionDesc}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============= PAGE: TEACHER DASHBOARD ============= */}
            {activePage === 'dashboard' && (
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#111827' }}>Teacher Dashboard</h2>
                </div>

            {/* Navigation Bar */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                {[
                    { id: 'overview', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>school</span>Class Overview</> },
                    { id: 'vault', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>groups</span>Student Vault</> },
                    { id: 'global', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px', fontSize: '22px' }}>threat_intelligence</span>Global Risk Factors</> },
                    { id: 'settings', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>settings</span>Data & Settings</> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                            color: activeTab === tab.id ? '#111827' : '#6b7280',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: Data & Settings */}
            {activeTab === 'settings' && (
                <div>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>System Data & Administration</h3>
                    <CsvUpload onUploadSuccess={fetchStudents} />
                </div>
            )}

            {/* TAB CONTENT: Class Overview */}
            {activeTab === 'overview' && (
                <div style={{ marginTop: '10px' }}>
                    {loadingInsights || !classInsights ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading class insights...</div>
                    ) : (
                        <>
                            {/* KPI Cards Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Period 1 Grade</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{classInsights.avg_g1}<span style={{fontSize: '18px', color: '#9ca3af'}}>/20</span></div>
                                </div>
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Period 2 Grade</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{classInsights.avg_g2}<span style={{fontSize: '18px', color: '#9ca3af'}}>/20</span></div>
                                </div>
                                <div style={{ backgroundColor: '#f0f9ff', padding: '24px', borderRadius: '8px', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Predicted Final Grade</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7' }}>{classInsights.avg_pred_g3}<span style={{fontSize: '18px', color: '#7dd3fc'}}>/20</span></div>
                                </div>
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Total Absences</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: classInsights.avg_absences > 5 ? '#ef4444' : '#111827' }}>{classInsights.avg_absences}</div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', margin: '40px 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                <div style={{ margin: '0 16px', color: '#9ca3af', fontWeight: '500', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Cohort Analytical Breakdown
                                </div>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                            </div>

                            {/* Engineered Metrics Grid */}
                            {classInsights.engineered_metrics && (() => {
                                const METRIC_CFG = {
                                    'Risk_Index':     { label: 'Avg Risk Index',      icon: 'warning',         color: '#ef4444', bg: '#fef2f2', max: '/ 30' },
                                    'Fail_Burden':    { label: 'Failure Burden',       icon: 'weight',          color: '#f59e0b', bg: '#fffbeb', max: '/ 30' },
                                    'Total_Alcohol':  { label: 'Alcohol Intake',       icon: 'local_bar',       color: '#8b5cf6', bg: '#f5f3ff', max: '/ 10' },
                                    'Social_Life':    { label: 'Social Activity',      icon: 'groups',          color: '#10b981', bg: '#ecfdf5', max: '/ 10' },
                                    'Study_Support':  { label: 'Study Support',        icon: 'menu_book',       color: '#3b82f6', bg: '#eff6ff', max: '/ 3'  },
                                    'Parent_Edu_Sum': { label: 'Parental Education',   icon: 'family_restroom', color: '#ec4899', bg: '#fdf2f8', max: '/ 8'  },
                                    'G2_G1_delta':    { label: 'G2-G1 Grade Delta',   icon: 'trending_up',     color: '#14b8a6', bg: '#f0fdfa', max: ''     },
                                };
                                return (
                                    <div style={{ marginBottom: '30px' }}>
                                        <h3 style={{ color: '#111827', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ marginRight: '8px', color: '#6366f1' }}>science</span>
                                            Engineered Cohort Metrics
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                                            {Object.entries(METRIC_CFG).map(([key, cfg]) => {
                                                const val = classInsights.engineered_metrics[key];
                                                if (val === undefined) return null;
                                                const isActive = activeTrend === key;
                                                const isLoading = trendLoading === key;
                                                return (
                                                    <div key={key} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: `1px solid ${cfg.bg}`, borderLeft: `4px solid ${cfg.color}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                                            <div style={{ backgroundColor: cfg.bg, color: cfg.color, padding: '10px', borderRadius: '50%', display: 'flex', marginRight: '16px', flexShrink: 0 }}>
                                                                <span className="material-symbols-outlined">{cfg.icon}</span>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{cfg.label}</div>
                                                                <div style={{ color: '#111827', fontSize: '24px', fontWeight: 'bold', lineHeight: 1.1 }}>
                                                                    {val}
                                                                    {cfg.max && <span style={{ fontSize: '14px', color: '#9ca3af', marginLeft: '4px' }}>{cfg.max}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleTrendToggle(key, user?.token)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                                padding: '5px 10px', fontSize: '12px', fontWeight: '600',
                                                                color: isActive ? cfg.color : '#6b7280',
                                                                backgroundColor: isActive ? cfg.bg : '#f9fafb',
                                                                border: `1px solid ${isActive ? cfg.color : '#e5e7eb'}`,
                                                                borderRadius: '6px', cursor: 'pointer',
                                                                transition: 'all 0.2s', width: '100%', justifyContent: 'center'
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                                                {isLoading ? 'hourglass_empty' : isActive ? 'expand_less' : 'show_chart'}
                                                            </span>
                                                            {isLoading ? 'Loading...' : isActive ? 'Hide Trend' : 'View Trend'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Lazy-loaded chart panel ΓÇö full width, below the grid */}
                                        {activeTrend && trendPlots[activeTrend] && (
                                            <div style={{
                                                marginTop: '20px', backgroundColor: 'white', padding: '24px',
                                                borderRadius: '8px', border: `1px solid ${METRIC_CFG[activeTrend]?.bg || '#e5e7eb'}`,
                                                borderTop: `3px solid ${METRIC_CFG[activeTrend]?.color || '#6366f1'}`,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center'
                                            }}>
                                                <h4 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '16px' }}>
                                                    {METRIC_CFG[activeTrend]?.label} — vs Predicted Final Grade
                                                </h4>
                                                <img
                                                    src={`data:image/png;base64,${trendPlots[activeTrend]}`}
                                                    alt={`${activeTrend} trend`}
                                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Global Risk Factors */}
            {activeTab === 'global' && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {loadingInsights || !classInsights ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading model insights...</div>
                    ) : !classInsights.shap_graph_base64 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                            <p style={{ color: '#6b7280' }}>No global risk data available.</p>
                        </div>
                    ) : (
                        <>
                            {/* Card 1: SHAP Average Bar Chart */}
                            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#6366f1' }}>bar_chart</span>
                                    Class-Wide Average Risk Drivers
                                </h3>
                                <p style={{ color: '#4b5563', fontSize: '14px', maxWidth: '800px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                                    Average SHAP impact of each feature across your entire cohort. Features to the <span style={{color: '#e74c3c', fontWeight: 'bold'}}>right</span> increase risk probability; features to the <span style={{color: '#27ae60', fontWeight: 'bold'}}>left</span> are protective.
                                </p>
                                <img
                                    src={`data:image/png;base64,${classInsights.shap_graph_base64}`}
                                    alt="Global SHAP Averages Chart"
                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                                />
                            </div>

                            {/* Card 2: SHAP Decision Plot — Interactive */}
                            {classInsights.decision_plot_base64 && (() => {
                                const dpCacheKey = dpMode === 'student' ? `student_${dpStudentInput}` : dpMode;
                                const dpData = dpCache[dpCacheKey];
                                const displayPlot = dpData ? dpData.plot : classInsights.decision_plot_base64;

                                const MODE_BTNS = [
                                    { key: 'all',      label: 'All Students',  icon: 'groups',          color: '#6366f1', bg: '#eef2ff' },
                                    { key: 'high',     label: 'High Risk',     icon: 'emergency_home',  color: '#ef4444', bg: '#fef2f2' },
                                    { key: 'moderate', label: 'Moderate Risk', icon: 'warning',         color: '#f59e0b', bg: '#fffbeb' },
                                    { key: 'low',      label: 'Low Risk',      icon: 'check_circle',    color: '#10b981', bg: '#ecfdf5' },
                                ];

                                return (
                                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#8b5cf6' }}>account_tree</span>
                                            SHAP Decision Plot — Individual Student Paths
                                        </h3>
                                        <p style={{ color: '#4b5563', fontSize: '13px', maxWidth: '800px', margin: '0 auto 20px', lineHeight: '1.6', textAlign: 'center' }}>
                                            Each line = one student's path from the model base rate to their final risk score.
                                            Lines curving <span style={{color:'#e74c3c',fontWeight:'bold'}}>right</span> = risk-increasing;
                                            <span style={{color:'#3b82f6',fontWeight:'bold'}}> left</span> = protective.
                                        </p>

                                        {/* Filter buttons */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                                            {MODE_BTNS.map(btn => (
                                                <button
                                                    key={btn.key}
                                                    onClick={() => fetchDecisionPlot(btn.key, null, user?.token)}
                                                    disabled={dpLoading}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        padding: '7px 14px', fontSize: '13px', fontWeight: '600',
                                                        color: dpMode === btn.key ? btn.color : '#6b7280',
                                                        backgroundColor: dpMode === btn.key ? btn.bg : '#f9fafb',
                                                        border: `1.5px solid ${dpMode === btn.key ? btn.color : '#e5e7eb'}`,
                                                        borderRadius: '8px', cursor: dpLoading ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s', opacity: dpLoading ? 0.6 : 1
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{btn.icon}</span>
                                                    {btn.label}
                                                </button>
                                            ))}

                                            {/* Student number input */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: `1.5px solid ${dpMode === 'student' ? '#8b5cf6' : '#e5e7eb'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: dpMode === 'student' ? '#f5f3ff' : '#f9fafb' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: dpMode === 'student' ? '#8b5cf6' : '#9ca3af', marginLeft: '10px' }}>person_search</span>
                                                <input
                                                    type="number"
                                                    placeholder="Student #"
                                                    value={dpStudentInput}
                                                    onChange={e => setDpStudentInput(e.target.value)}
                                                    style={{ width: '90px', border: 'none', background: 'transparent', padding: '7px 6px', fontSize: '13px', outline: 'none', color: '#111827' }}
                                                />
                                                <button
                                                    onClick={() => { if (dpStudentInput) fetchDecisionPlot('student', dpStudentInput, user?.token); }}
                                                    disabled={dpLoading || !dpStudentInput}
                                                    style={{ padding: '7px 12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', cursor: dpStudentInput ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: '700', opacity: dpStudentInput ? 1 : 0.5 }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>

                                        {/* Result area */}
                                        {dpLoading ? (
                                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>hourglass_empty</span>
                                                Generating decision plot...
                                            </div>
                                        ) : dpError ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '14px' }}>
                                                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px' }}>error</span>
                                                {dpError}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                {dpData && <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>{dpData.title} · {dpData.count} student{dpData.count !== 1 ? 's' : ''}</p>}
                                                <img
                                                    src={`data:image/png;base64,${displayPlot}`}
                                                    alt="SHAP Decision Plot"
                                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}

            {/* TAB CONTENT: Student Vault */}
            {activeTab === 'vault' && (
                <>


            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading students...</div>
            ) : (
                <div style={{ marginTop: '30px' }}>
                    {/* Header Controls with Sort Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Student Vault ({students.length})</h3>
                        
                        {students.length > 0 && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button 
                                    onClick={toggleSort}
                                    style={{
                                        padding: '8px 16px', backgroundColor: '#4b5563', color: 'white', border: 'none',
                                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_vert</span> Sort: {sortOrder === 'highest' ? 'Highest Risk First' : 'Lowest Risk First'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Risk Tier</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Current G1</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Current G2</th>
                                    <th style={{...thStyle, textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1'}}>Predicted G3</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Total Absences</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map(s => {
                                    const isHighRisk = s.risk_category && s.risk_category.includes('HIGH');
                                    const isModerate = s.risk_category && s.risk_category.includes('MODERATE');
                                    
                                    let badgeStyle = {
                                        padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold',
                                        backgroundColor: '#e5e7eb', color: '#374151', display: 'inline-flex', alignItems: 'center'
                                    };
                                    
                                    if (isHighRisk) {
                                        badgeStyle = { ...badgeStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
                                    } else if (isModerate) {
                                        badgeStyle = { ...badgeStyle, backgroundColor: '#fef3c7', color: '#d97706' };
                                    } else {
                                        badgeStyle = { ...badgeStyle, backgroundColor: '#d1fae5', color: '#047857' };
                                    }

                                    return (
                                        <tr key={s.id} style={{ transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{...tdStyle, fontWeight: '500'}}>{s.student_name}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={badgeStyle}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>threat_intelligence</span>
                                                        {(s.risk_category || "UNSCORED").replace(/≡ƒö┤ |≡ƒƒí |≡ƒƒó /g, '')}
                                                    </span>
                                                    {s.risk_score !== undefined && (
                                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                                            ({(s.risk_score * 100).toFixed(1)}%)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>{s.G1}</td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>{s.G2}</td>
                                            <td style={{...tdStyle, textAlign: 'center', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#f0f9ff'}}>
                                                {s.predicted_g3 || '-'}
                                            </td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>{s.absences}</td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>
                                                <button onClick={() => navigate(`/student/${s.id}`)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                                    Insights →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {students.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Your vault is empty. Go to Data & Settings to upload a CSV and get started!</div>
                        )}
                    </div>
                </div>
            )}
            </>
            )}
            </div>
            )} {/* end activePage === 'dashboard' */}

            </div> {/* end main content area */}
        </div>
    );
};

export default Dashboard;
