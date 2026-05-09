import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const HodDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState(() => localStorage.getItem('hod_page') || 'overview');
    const [expandedTeacher, setExpandedTeacher] = useState(null);
    const [sentMessages, setSentMessages] = useState({}); // { 'teacher_actionKey': true }

    const sendHodMessage = (teacherName, msgType, msgLabel, msgDesc) => {
        const key = `${teacherName}_${msgType}`;
        if (sentMessages[key]) return;
        // Store in shared localStorage for faculty to read
        const existing = JSON.parse(localStorage.getItem('failsafe_hod_messages') || '[]');
        existing.unshift({
            id: Date.now(),
            toFaculty: teacherName,
            fromHod: user?.username || 'HoD',
            msgType,
            msgLabel,
            msgDesc,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('failsafe_hod_messages', JSON.stringify(existing));
        setSentMessages(prev => ({ ...prev, [key]: true }));
    };


    useEffect(() => { localStorage.setItem('hod_page', activePage); }, [activePage]);

    // Read all faculty notifications from localStorage
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

    const StatCard = ({ icon, label, value, color, bg }) => (
        <div style={{ flex: 1, minWidth: '180px', padding: '20px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>{icon}</span>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>{label}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
        </div>
    );

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
                        { key: 'faculty', icon: 'groups', label: 'Faculty Data' },
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
            <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>Loading department data...</div>
                ) : (
                <>
                {/* === OVERVIEW PAGE === */}
                {activePage === 'overview' && (
                    <div style={{ padding: '28px 32px', backgroundColor: '#f8f9ff', minHeight: '100vh' }}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '24px', color: '#111827' }}>Department Overview</h2>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Aggregated metrics across all faculty members.</p>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
                            <StatCard icon="groups" label="Total Faculty" value={agg.total_teachers || 0} color="#6366f1" />
                            <StatCard icon="school" label="Total Students" value={agg.total_students || 0} color="#3b82f6" />
                            <StatCard icon="emergency_home" label="High Risk" value={agg.total_high_risk || 0} color="#ef4444" />
                            <StatCard icon="warning" label="Moderate Risk" value={agg.total_moderate_risk || 0} color="#f59e0b" />
                            <StatCard icon="check_circle" label="Low Risk" value={agg.total_low_risk || 0} color="#10b981" />
                        </div>

                        {/* Faculty comparison table */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>Faculty Comparison</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f9fafb' }}>
                                            {['Faculty', 'Students', 'Avg Risk %', 'High', 'Moderate', 'Low', 'Avg G1', 'Avg G2', 'Avg Pred G3', 'Avg Absences'].map(h => (
                                                <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', textAlign: 'center', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachers.map(t => (
                                            <tr key={t.teacher_name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '12px 14px', fontWeight: '700', color: '#111827' }}>{t.teacher_name}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{t.total_students}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: t.avg_risk_pct > 50 ? '#ef4444' : t.avg_risk_pct > 30 ? '#f59e0b' : '#10b981' }}>{t.avg_risk_pct}%</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#ef4444', fontWeight: '700' }}>{t.high_risk}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#f59e0b', fontWeight: '700' }}>{t.moderate_risk}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#10b981', fontWeight: '700' }}>{t.low_risk}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{t.avg_g1}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{t.avg_g2}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#2563eb', fontWeight: '700' }}>{t.avg_pred_g3}</td>
                                                <td style={{ padding: '12px 14px', textAlign: 'center' }}>{t.avg_absences}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {teachers.length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No faculty data found. Faculty members need to upload student CSV data first.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* === FACULTY DATA PAGE === */}
                {activePage === 'faculty' && (
                    <div style={{ padding: '28px 32px', backgroundColor: '#f8f9ff', minHeight: '100vh' }}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '24px', color: '#111827' }}>Faculty Details</h2>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Click on a faculty member to expand their class metrics.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {teachers.map(t => {
                                const isExp = expandedTeacher === t.teacher_name;
                                const riskColor = t.avg_risk_pct > 50 ? '#ef4444' : t.avg_risk_pct > 30 ? '#f59e0b' : '#10b981';
                                return (
                                    <div key={t.teacher_name} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${riskColor}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                        <div onClick={() => setExpandedTeacher(isExp ? null : t.teacher_name)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg,${riskColor}33,${riskColor}11)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: riskColor }}>person</span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>{t.teacher_name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.total_students} students</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', backgroundColor: `${riskColor}15`, color: riskColor }}>{t.avg_risk_pct}% avg risk</span>
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: isExp ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                                            </div>
                                        </div>
                                        {isExp && (
                                            <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '14px' }}>
                                                    {[
                                                        { l: 'Avg G1', v: t.avg_g1, c: '#3b82f6' },
                                                        { l: 'Avg G2', v: t.avg_g2, c: '#6366f1' },
                                                        { l: 'Avg Pred G3', v: t.avg_pred_g3, c: '#2563eb' },
                                                        { l: 'High Risk', v: t.high_risk, c: '#ef4444' },
                                                        { l: 'Moderate', v: t.moderate_risk, c: '#f59e0b' },
                                                        { l: 'Low Risk', v: t.low_risk, c: '#10b981' },
                                                        { l: 'Avg Absences', v: t.avg_absences, c: '#8b5cf6' },
                                                    ].map(m => (
                                                        <div key={m.l} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>{m.l}</div>
                                                            <div style={{ fontSize: '20px', fontWeight: '800', color: m.c }}>{m.v}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* HoD Actions for this faculty */}
                                                <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Send Feedback to {t.teacher_name}</div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {[
                                                            { key: 'good_work', label: 'Good Work 👍', desc: 'Your class performance metrics are excellent. Keep up the great work!', icon: 'thumb_up', color: '#10b981', bg: '#ecfdf5' },
                                                            { key: 'take_action', label: 'Take Action Immediately ⚠️', desc: 'Several students in your class need urgent attention. Please review the Take Action panel.', icon: 'priority_high', color: '#ef4444', bg: '#fef2f2' },
                                                            { key: 'needs_improvement', label: 'Needs Improvement', desc: 'Class average metrics need improvement. Please review student performance and take corrective measures.', icon: 'trending_down', color: '#f59e0b', bg: '#fffbeb' },
                                                            { key: 'schedule_meeting', label: 'Schedule Meeting', desc: 'Please schedule a meeting with the HoD to discuss class progress and student welfare.', icon: 'event', color: '#6366f1', bg: '#eef2ff' },
                                                        ].map(action => {
                                                            const sent = sentMessages[`${t.teacher_name}_${action.key}`];
                                                            return (
                                                                <button
                                                                    key={action.key}
                                                                    disabled={sent}
                                                                    onClick={() => sendHodMessage(t.teacher_name, action.key, action.label, action.desc)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                                        padding: '7px 14px', fontSize: '12px', fontWeight: '700',
                                                                        color: sent ? '#9ca3af' : action.color,
                                                                        backgroundColor: sent ? '#f3f4f6' : action.bg,
                                                                        border: `1px solid ${sent ? '#e5e7eb' : action.color + '33'}`,
                                                                        borderRadius: '8px', cursor: sent ? 'default' : 'pointer',
                                                                        transition: 'all 0.15s'
                                                                    }}
                                                                    onMouseEnter={e => { if (!sent) { e.currentTarget.style.backgroundColor = action.color; e.currentTarget.style.color = 'white'; } }}
                                                                    onMouseLeave={e => { if (!sent) { e.currentTarget.style.backgroundColor = action.bg; e.currentTarget.style.color = action.color; } }}
                                                                >
                                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{sent ? 'check' : action.icon}</span>
                                                                    {sent ? 'Sent!' : action.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {teachers.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                                    <p style={{ color: '#9ca3af', margin: 0 }}>No faculty data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === ACTIONS LOG PAGE === */}
                {activePage === 'actions' && (
                    <div style={{ padding: '28px 32px', backgroundColor: '#f8f9ff', minHeight: '100vh' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#6366f1' }}>task_alt</span>
                            <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Faculty Actions Log</h2>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Work done by faculty members on students.</p>

                        {allNotifs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '10px' }}>assignment</span>
                                <p style={{ color: '#9ca3af', margin: 0, fontSize: '15px' }}>No actions recorded yet.</p>
                                <p style={{ color: '#d1d5db', margin: '6px 0 0', fontSize: '13px' }}>Faculty members mark actions as done from the Take Action panel.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {allNotifs.map((n, i) => (
                                    <div key={n.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', borderLeft: '3px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>check_circle</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', color: '#111827' }}>
                                                <span style={{ fontWeight: '700' }}>Action taken</span> on <span style={{ fontWeight: '700', color: '#6366f1' }}>{n.studentName}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '2px', fontWeight: '600' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '13px', verticalAlign: 'text-bottom', marginRight: '3px' }}>person</span>
                                                    By: {n.facultyName || 'Faculty'}
                                                </div>
                                            <div style={{ fontSize: '13px', color: '#374151', marginTop: '3px' }}>
                                                <span style={{ fontWeight: '600' }}>{n.actionLabel}</span> — {n.actionDesc}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    );
};

export default HodDashboard;