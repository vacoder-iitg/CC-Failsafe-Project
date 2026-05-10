import React from 'react';

const ActionsLog = ({ allNotifs }) => {
    return (
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
    );
};

export default ActionsLog;
