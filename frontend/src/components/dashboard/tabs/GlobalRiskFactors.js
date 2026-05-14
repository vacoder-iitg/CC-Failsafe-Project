import React, { useState, useEffect, useCallback, useMemo } from 'react';

const GlobalRiskFactors = React.memo(({ classInsights, loadingInsights, user, sharedCache, setSharedCache }) => {
    // Decision plot interactive state
    const [dpMode, setDpMode] = useState('high');
    const [dpStudentInput, setDpStudentInput] = useState('');
    const [dpLoading, setDpLoading] = useState(false);
    const [dpError, setDpError] = useState('');
    const [lastFetchedKey, setLastFetchedKey] = useState('high');

    // Use shared cache if provided, otherwise fallback to local state (for standalone usage)
    const [localCache, setLocalCache] = useState({});
    const dpCache = sharedCache || localCache;
    const updateCache = setSharedCache || setLocalCache;

    const fetchDecisionPlot = useCallback((mode, studentNum, token) => {
        const cacheKey = mode === 'student' ? `student_${studentNum}` : mode;
        setDpMode(mode);
        if (dpCache[cacheKey]) { 
            setLastFetchedKey(cacheKey);
            setDpError(''); 
            return; 
        }
        setDpLoading(true);
        setDpError('');
        const params = mode === 'student' ? `?mode=student&student_num=${studentNum}` : `?mode=${mode}`;
        fetch(`http://localhost:8000/class/decision-plot${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.plot) setDpError(data.title || 'No data returned');
                else {
                    updateCache(prev => ({ ...prev, [cacheKey]: data }));
                    setLastFetchedKey(cacheKey);
                }
                setDpLoading(false);
            })
            .catch(() => { setDpError('Failed to fetch decision plot'); setDpLoading(false); });
    }, [dpCache, updateCache]);

    useEffect(() => {
        if (classInsights && !dpCache['high'] && !dpLoading) {
            const timer = setTimeout(() => {
                fetchDecisionPlot('high', null, user?.token);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [classInsights, user?.token, dpCache, dpLoading, fetchDecisionPlot]);

    const MODE_BTNS = useMemo(() => [
        { key: 'high',     label: 'High Risk',     icon: 'emergency_home',  color: '#ef4444', bg: '#fef2f2' },
        { key: 'moderate', label: 'Moderate Risk', icon: 'warning',         color: '#f59e0b', bg: '#fffbeb' },
        { key: 'low',      label: 'Low Risk',      icon: 'check_circle',    color: '#10b981', bg: '#ecfdf5' },
    ], []);

    const decisionPlotContent = useMemo(() => {
        const dpData = dpCache[lastFetchedKey];
        const displayPlot = dpData ? dpData.plot : classInsights?.decision_plot_base64;

        if (dpError) {
            return (
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', fontSize: '14px' }}>
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px' }}>error</span>
                    {dpError}
                </div>
            );
        }

        if (displayPlot) {
            return (
                <div style={{ textAlign: 'center' }}>
                    {dpLoading && <p style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>Loading new graph...</p>}
                    {dpData && !dpLoading && <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>{dpData.title} · {dpData.count} student{dpData.count !== 1 ? 's' : ''}</p>}
                    <img
                        src={`data:image/png;base64,${displayPlot}`}
                        alt="SHAP Decision Plot"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '6px', opacity: dpLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}
                    />
                </div>
            );
        }

        if (dpLoading) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>hourglass_empty</span>
                    Generating decision plot...
                </div>
            );
        }

        return null;
    }, [dpCache, lastFetchedKey, classInsights?.decision_plot_base64, dpError, dpLoading]);

    if (loadingInsights || !classInsights) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
                <img 
                    src="https://cdn.dribbble.com/users/980520/screenshots/2859415/monitoring.gif" 
                    alt="AI Analysis" 
                    style={{ width: '160px', marginBottom: '20px', borderRadius: '12px' }}
                />
                <h3 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Deep AI Global Analysis...</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Connecting to ML models for global risk factor extraction.</p>
            </div>
        );
    }


    return (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#6366f1' }}>bar_chart</span>
                    Class-Wide Average Risk Drivers
                </h3>
                <p style={{ color: '#4b5563', fontSize: '14px', maxWidth: '800px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                    Average SHAP impact of each feature across your entire cohort. Features to the <span style={{color: '#e74c3c', fontWeight: 'bold'}}>right</span> increase risk probability; features to the <span style={{color: '#27ae60', fontWeight: 'bold'}}>left</span> are protective.
                </p>
                {classInsights.shap_graph_base64 ? (
                    <img
                        src={`data:image/png;base64,${classInsights.shap_graph_base64}`}
                        alt="Global SHAP Averages Chart"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                ) : <p>No SHAP graph available.</p>}
            </div>

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

                {decisionPlotContent}
            </div>
        </div>
    );
});

export default GlobalRiskFactors;
