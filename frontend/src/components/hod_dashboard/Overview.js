import React from 'react';

const Overview = ({ agg, teachers }) => {
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
    );
};

export default Overview;
