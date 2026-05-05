import React, { useState, useEffect } from 'react';

const Notifications = ({ user }) => {
    const [hodMsgs, setHodMsgs] = useState([]);

    useEffect(() => {
        const msgs = JSON.parse(localStorage.getItem('failsafe_hod_messages') || '[]')
            .filter(m => m.toTeacher === user?.username);
        setHodMsgs(msgs);
    }, [user]);

    return (
        <div style={{ padding: '28px 32px', backgroundColor: 'transparent', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#6366f1' }}>notifications</span>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Notifications</h2>
                {hodMsgs.length > 0 && (
                    <span style={{ backgroundColor: '#eef2ff', color: '#6366f1', fontSize: '13px', fontWeight: '700', padding: '2px 10px', borderRadius: '9999px' }}>
                        {hodMsgs.length}
                    </span>
                )}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                Direct directives and messages from the Head of Department (HoD).
            </p>

            {hodMsgs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '10px' }}>notifications_off</span>
                    <p style={{ color: '#9ca3af', margin: 0, fontSize: '15px' }}>No messages from HoD yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                </div>
            )}
        </div>
    );
};

export default Notifications;