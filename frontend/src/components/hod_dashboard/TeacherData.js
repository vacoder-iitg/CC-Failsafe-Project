import React, { useState } from 'react';

const FacultyData = ({ facultyList, user }) => {
    const [expandedFaculty, setExpandedFaculty] = useState(null);
    const [sentMessages, setSentMessages] = useState({}); // { 'facultyName_actionKey': true }

    const sendHodMessage = (facultyName, msgType, msgLabel, msgDesc) => {
        const key = `${facultyName}_${msgType}`;
        if (sentMessages[key]) return;
        // Store in shared localStorage for faculty to read
        const existing = JSON.parse(localStorage.getItem('failsafe_hod_messages') || '[]');
        existing.unshift({
            id: Date.now(),
            toTeacher: facultyName,
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

    return (
        <div style={{ padding: '28px 32px', backgroundColor: 'transparent', minHeight: '100vh' }}>

            <h2 style={{ margin: '0 0 6px', fontSize: '24px', color: '#111827' }}>Faculty Details</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Click on a faculty member to expand their class metrics.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {facultyList.map(t => {
                    const isExp = expandedFaculty === t.teacher_name;
                    const riskColor = t.avg_risk_pct > 50 ? '#ef4444' : t.avg_risk_pct > 30 ? '#f59e0b' : '#10b981';
                    return (
                        <div key={t.teacher_name} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${riskColor}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div onClick={() => setExpandedFaculty(isExp ? null : t.teacher_name)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }}
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
                {facultyList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>No faculty data available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default FacultyData;
