import React, { useState } from 'react';

const ClassOverview = ({ classInsights, loadingInsights, user }) => {
    // Trend chart lazy-load state
    const [activeTrend, setActiveTrend] = useState(null);   // key of expanded metric
    const [trendPlots, setTrendPlots] = useState({});        // cache: key -> base64
    const [trendLoading, setTrendLoading] = useState(null);  // key currently fetching

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

    if (loadingInsights || !classInsights) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading class insights...</div>;
    }

    return (
        <div style={{ marginTop: '10px' }}>
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

                        {/* Lazy-loaded chart panel */}
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
        </div>
    );
};

export default ClassOverview;
