import React from 'react';

const Notifications = ({ notifications, unreadCount, markAllRead, user }) => {
    return (
        <div style={{ padding: '28px 32px', backgroundColor: 'transparent', minHeight: '100vh' }}>

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
                            .filter(m => m.toTeacher === user?.username);
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
    );
};

export default Notifications;
