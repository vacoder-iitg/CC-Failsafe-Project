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
    const [activeTab, setActiveTab] = useState('overview');

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
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Teacher Dashboard</h2>
                <button onClick={logout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Logout
                </button>
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

                                        {/* Lazy-loaded chart panel — full width, below the grid */}
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
                <div style={{ marginTop: '10px' }}>
                    {loadingInsights || !classInsights ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading model insights...</div>
                    ) : classInsights.shap_graph_base64 ? (
                        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6', fontSize: '20px' }}>
                                Global Model Explainability (SHAP)
                            </h3>
                            <p style={{ color: '#4b5563', fontSize: '15px', maxWidth: '800px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                                This chart visualizes the average directional impact of all tracked features across your entire student cohort. Features extending to the <span style={{color: '#e74c3c', fontWeight: 'bold'}}>right</span> represent risk drivers, while features extending to the <span style={{color: '#27ae60', fontWeight: 'bold'}}>left</span> act as protective factors.
                            </p>
                            <img 
                                src={`data:image/png;base64,${classInsights.shap_graph_base64}`} 
                                alt="Global SHAP Averages Chart" 
                                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                            />
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                            <p style={{ color: '#6b7280' }}>No global risk data available.</p>
                        </div>
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
                                                        {(s.risk_category || "UNSCORED").replace(/🔴 |🟡 |🟢 /g, '')}
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
    );
};

export default Dashboard;