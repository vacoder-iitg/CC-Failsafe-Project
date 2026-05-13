import React, { useState, useRef, useEffect } from 'react';

const ClassOverview = ({ classInsights, loadingInsights, user }) => {
    // Trend chart lazy-load state
    const [activeTrend, setActiveTrend] = useState(null);   // key of expanded metric
    const [trendPlots, setTrendPlots] = useState({});        // cache: key -> base64
    const [trendLoading, setTrendLoading] = useState(null);  // key currently fetching

    // Reference to the chart container for auto-scrolling
    const chartRef = useRef(null);

    // Watch for when a chart becomes active and is fully loaded, then scroll to it
    useEffect(() => {
        if (activeTrend && trendPlots[activeTrend] && chartRef.current) {
            // A tiny timeout ensures the browser has rendered the base64 image 
            // before calculating the scroll position, preventing jerky movements.
            setTimeout(() => {
                chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [activeTrend, trendPlots]);

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
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{classInsights.avg_g1}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/20</span></div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Period 2 Grade</h4>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{classInsights.avg_g2}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/20</span></div>
                </div>
                <div style={{ backgroundColor: '#f0f9ff', padding: '24px', borderRadius: '8px', border: '1px solid #bae6fd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Predicted Final Grade</h4>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7' }}>{classInsights.avg_pred_g3}<span style={{ fontSize: '18px', color: '#7dd3fc' }}>/20</span></div>
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
                    'Risk_Index': { label: 'Avg Risk Index', icon: 'warning', color: '#ef4444', bg: '#fef2f2', max: '/ 30', description: 'Aggregate score quantifying the overall probability of academic failure based on historical performance and absences.' },
                    'Fail_Burden': { label: 'Failure Burden', icon: 'weight', color: '#f59e0b', bg: '#fffbeb', max: '/ 30', description: 'Measures the cumulative impact of past class failures, highlighting students with historical academic struggles.' },
                    'Total_Alcohol': { label: 'Alcohol Intake', icon: 'local_bar', color: '#8b5cf6', bg: '#f5f3ff', max: '/ 10', description: 'Combined index of workday and weekend alcohol consumption, indicating potential lifestyle impacts on study habits.' },
                    'Social_Life': { label: 'Social Activity', icon: 'groups', color: '#10b981', bg: '#ecfdf5', max: '/ 10', description: 'Frequency of going out with friends, balancing social well-being with potential distractions from academics.' },
                    'Study_Support': { label: 'Study Support', icon: 'menu_book', color: '#3b82f6', bg: '#eff6ff', max: '/ 3', description: 'Level of extra educational support (e.g., family assistance, paid classes) the student receives outside of school.' },
                    'Parent_Edu_Sum': { label: 'Parental Education', icon: 'family_restroom', color: '#ec4899', bg: '#fdf2f8', max: '/ 8', description: 'Combined educational background of both parents, often correlating with academic guidance and resources at home.' },
                    'G2_G1_delta': { label: 'G2-G1 Grade Delta', icon: 'trending_up', color: '#14b8a6', bg: '#f0fdfa', max: '', description: 'Difference between Period 2 and Period 1 grades, tracking whether the class trajectory is generally improving or declining.' },
                };

                return (
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ color: '#111827', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ marginRight: '8px', color: '#6366f1' }}>science</span>
                            Engineered Cohort Metrics
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(METRIC_CFG).map(([key, cfg]) => {
                                const val = classInsights.engineered_metrics[key];
                                if (val === undefined) return null;
                                const isActive = activeTrend === key;
                                const isLoading = trendLoading === key;
                                return (
                                    <div key={key} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: `1px solid ${cfg.bg}`, borderLeft: `4px solid ${cfg.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: '300px' }}>
                                                <div style={{ backgroundColor: cfg.bg, color: cfg.color, padding: '12px', borderRadius: '50%', display: 'flex', marginRight: '16px', flexShrink: 0 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{cfg.icon}</span>
                                                </div>
                                                <div>
                                                    <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{cfg.label}</div>
                                                    <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.5', maxWidth: '600px' }}>
                                                        {cfg.description}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right', paddingRight: '10px' }}>
                                                <div style={{ color: '#111827', fontSize: '32px', fontWeight: 'bold', lineHeight: 1.1 }}>
                                                    {val}
                                                    {cfg.max && <span style={{ fontSize: '16px', color: '#9ca3af', marginLeft: '4px', fontWeight: 'normal' }}>{cfg.max}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <button
                                                onClick={() => handleTrendToggle(key, user?.token)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                                                    color: isActive ? cfg.color : '#4b5563',
                                                    backgroundColor: isActive ? cfg.bg : '#f3f4f6',
                                                    border: `1px solid ${isActive ? cfg.color : '#e5e7eb'}`,
                                                    borderRadius: '6px', cursor: 'pointer',
                                                    transition: 'all 0.2s', width: 'fit-content'
                                                }}
                                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                    {isLoading ? 'hourglass_empty' : isActive ? 'expand_less' : 'show_chart'}
                                                </span>
                                                {isLoading ? 'Loading...' : isActive ? 'Hide Trend Chart' : 'View Trend Chart'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Lazy-loaded chart panel with ref attached */}
                        {activeTrend && trendPlots[activeTrend] && (
                            <div
                                ref={chartRef}
                                style={{
                                    marginTop: '24px', backgroundColor: 'white', padding: '32px',
                                    borderRadius: '8px', border: `1px solid ${METRIC_CFG[activeTrend]?.bg || '#e5e7eb'}`,
                                    borderTop: `4px solid ${METRIC_CFG[activeTrend]?.color || '#6366f1'}`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center',
                                    animation: 'fadeInTab 0.4s ease-out'
                                }}
                            >
                                <h4 style={{ margin: '0 0 20px', color: '#1f2937', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ color: METRIC_CFG[activeTrend]?.color }}>{METRIC_CFG[activeTrend]?.icon}</span>
                                    {METRIC_CFG[activeTrend]?.label} Distribution vs Predicted Final Grade
                                </h4>
                                <img
                                    src={`data:image/png;base64,${trendPlots[activeTrend]}`}
                                    alt={`${activeTrend} trend`}
                                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #f3f4f6' }}
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