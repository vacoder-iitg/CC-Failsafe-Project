import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8000/students/${id}/insights`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${user?.token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Network error');
            return res.json();
        })
        .then(data => { setProfileData(data); setLoading(false); })
        .catch(err => { console.error("Fetch error:", err); setLoading(false); });
    }, [id, user]);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh', 
                fontFamily: "'Inter', sans-serif",
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '400px',
                    width: '100%',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                    <img 
                        src="https://cdn.dribbble.com/users/980520/screenshots/2859415/monitoring.gif" 
                        alt="AI Analysis" 
                        style={{ 
                            width: '240px', 
                            height: 'auto', 
                            marginBottom: '24px', 
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <h2 style={{ 
                        margin: '0 0 12px 0', 
                        color: '#1e293b', 
                        fontSize: '24px', 
                        fontWeight: '800',
                        letterSpacing: '-0.02em'
                    }}>
                        Running Deep AI Analysis...
                    </h2>
                    <p style={{ 
                        margin: 0, 
                        color: '#64748b', 
                        fontSize: '15px',
                        lineHeight: '1.5',
                        fontWeight: '500'
                    }}>
                        Please wait while FAILSAFE crunches student metrics and generates real-time risk assessments.
                    </p>
                    
                    <div style={{ 
                        marginTop: '24px',
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '40%',
                            height: '100%',
                            backgroundColor: '#6366f1',
                            borderRadius: '2px',
                            animation: 'loadingBar 1.5s infinite ease-in-out'
                        }} />
                    </div>
                    <style>
                        {`
                        @keyframes loadingBar {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(250%); }
                        }
                        `}
                    </style>
                </div>
            </div>
        );
    }


    if (!profileData || !profileData.student_info) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                <h2>Student Data Not Available</h2>
                <p>Could not load insights. They may belong to another user or the model is updating.</p>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            </div>
        );
    }

    const { student_info, recommended_actions, top_10_shap_drivers } = profileData;
    
    // Safely parse risk tier colors so .includes() never crashes
    const riskTier = student_info?.risk_tier || '🟢 LOW';
    const isHighRisk = riskTier.includes('HIGH');
    const isModRisk = riskTier.includes('MODERATE');
    const riskColor = isHighRisk ? '#b91c1c' : isModRisk ? '#b45309' : '#047857';
    const riskTierText = riskTier.replace(/🔴 |🟡 |🟢 /g, '');

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← Back to Dashboard</button>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#111827' }}>{student_info?.name || "Unknown Student"}</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Age: {student_info?.age || "N/A"}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '32px', color: riskColor }}>
                        {student_info?.at_risk_probability || "0%"}
                    </h2>
                    <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'bottom', marginRight: '4px', color: riskColor }}>threat_intelligence</span>
                        {riskTierText}
                    </p>
                </div>
            </div>

            {/* Middle Section: Stats & Interventions */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#1f2937' }}>Academic & Behavioral Profile</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>CURRENT G1</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: (student_info?.current_g1 || 0) < 10 ? '#ef4444' : '#1f2937' }}>{student_info?.current_g1 || 0}/20</span>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>PREDICTED G3</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d' }}>{student_info?.predicted_g3 || 0}/20</span>
                        </div>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>FAILURES</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: (student_info?.past_failures || 0) > 0 ? '#ef4444' : '#1f2937' }}>{student_info?.past_failures || 0}</span>
                        </div>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>ABSENCES</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: (student_info?.total_absences || 0) > 5 ? '#ef4444' : '#1f2937' }}>{student_info?.total_absences || 0}</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#1f2937' }}>AI Recommended Interventions</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6', margin: 0 }}>
                        {recommended_actions?.length > 0 ? recommended_actions.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '14px', color: '#374151' }}>{step}</li>
                        )) : (
                            <li style={{ color: '#6b7280', fontStyle: 'italic' }}>No specific actions recommended at this time.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Bottom Section: Deep AI Analysis (Beautiful UI Gauges) */}
            {top_10_shap_drivers && top_10_shap_drivers.length > 0 && (
                <div style={{ backgroundColor: 'transparent', marginTop: '30px' }}>
                    <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937' }}>
                        Deep AI Analysis: Priority Drivers & Impact
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '-10px', marginBottom: '20px' }}>
                        A prioritized list of critical issues with contextual insights, ranked by impact.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {top_10_shap_drivers.map((driver, idx) => {
                            const isRisk = driver?.type?.includes("Risk");
                            const isHigh = driver?.type?.includes("High");
                            
                            const impactColor = isRisk 
                                ? (isHigh ? '#b91c1c' : '#ef4444') 
                                : (isHigh ? '#15803d' : '#22c55e'); 
                            const bgColor = isRisk 
                                ? (isHigh ? '#fef2f2' : '#fff1f2') 
                                : (isHigh ? '#f0fdf4' : '#dcfce7');
                            
                            const score = driver?.impact_score || 0;
                            const impactText = score > 0 
                                ? `+${(score * 100).toFixed(1)}% Risk` 
                                : `${(score * 100).toFixed(1)}% Protective`;

                            // Dynamic Gauge Calculations
                            const scoreAbs = Math.abs(score);
                            const maxExpectedScore = 0.15; // Typical max SHAP impact
                            const percentage = Math.min(1, Math.max(0.1, scoreAbs / maxExpectedScore));
                            const angle = percentage * 90;
                            const arcLength = 31.416;
                            const dashOffset = arcLength - (percentage * arcLength);

                            // BULLETPROOF STRING PARSING
                            const rawString = driver?.raw_feature || driver?.feature || "";
                            const searchKeyword = rawString.includes('_') ? rawString.split('_')[0].toLowerCase() : rawString.toLowerCase();

                            const linkedAction = recommended_actions?.find(action => 
                                action.toLowerCase().includes(searchKeyword)
                            ) || "Monitor trajectory based on standard protocol";

                            return (
                                <div key={idx} style={{ 
                                    display: 'flex', alignItems: 'center', padding: '20px', 
                                    backgroundColor: 'white', borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' 
                                }}>
                                    
                                    {/* Left: Rank & Custom SVG Gauge */}
                                    <div style={{ display: 'flex', alignItems: 'center', width: '180px', borderRight: '1px solid #e5e7eb', marginRight: '20px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#374151', width: '70px' }}>
                                            Rank #{idx + 1}
                                        </div>
                                        <div style={{ marginLeft: '10px' }}>
                                            <svg width="48" height="24" viewBox="0 0 48 24" style={{ overflow: 'visible' }}>
                                                <path d="M 4 24 A 20 20 0 0 1 44 24" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
                                                {isRisk ? (
                                                    <path d="M 24 4 A 20 20 0 0 1 44 24" fill="none" stroke={impactColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={arcLength} strokeDashoffset={dashOffset} />
                                                ) : (
                                                    <path d="M 24 4 A 20 20 0 0 0 4 24" fill="none" stroke={impactColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={arcLength} strokeDashoffset={dashOffset} />
                                                )}
                                                <line x1="24" y1="24" x2="24" y2="4" stroke="#374151" strokeWidth="3" strokeLinecap="round" 
                                                      style={{ transform: `rotate(${isRisk ? angle : -angle}deg)`, transformOrigin: '24px 24px', transition: 'transform 0.5s ease' }} />
                                                <circle cx="24" cy="24" r="4" fill="#374151" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Right: Content & Context */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#111827' }}>
                                                <span style={{ color: impactColor, marginRight: '8px', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                                                        {isRisk ? 'trending_up' : 'trending_down'}
                                                    </span>
                                                </span>
                                                [{driver?.feature || "Unknown Feature"}]
                                            </div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: impactColor, backgroundColor: bgColor, padding: '4px 10px', borderRadius: '12px' }}>
                                                {impactText}
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginLeft: '24px' }}>
                                            
                                            {/* Visual Scale UI */}
                                            <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13px' }}>
                                                    <strong style={{ color: '#374151', display: 'flex', alignItems: 'center' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>person</span>
                                                        Student Value: {driver?.raw_student_value ?? 'N/A'}
                                                    </strong>
                                                    <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                                                        Class Average: {driver?.avg_value ?? 'N/A'}
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '4px' }}>group</span>
                                                    </span>
                                                </div>
                                                
                                                {driver?.min_value !== undefined && driver?.max_value !== undefined && (
                                                    <div style={{ position: 'relative', height: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                                                        {(() => {
                                                            const min = driver.min_value;
                                                            const max = driver.max_value;
                                                            const avg = driver.avg_value;
                                                            const val = driver.raw_student_value;
                                                            
                                                            const range = max - min;
                                                            const safeRange = range === 0 ? 1 : range;
                                                            
                                                            const avgPos = Math.max(0, Math.min(100, ((avg - min) / safeRange) * 100));
                                                            const valPos = Math.max(0, Math.min(100, ((val - min) / safeRange) * 100));
                                                            
                                                            const fillStart = Math.min(avgPos, valPos);
                                                            const fillWidth = Math.abs(avgPos - valPos);
                                                            
                                                            return (
                                                                <>
                                                                    {/* The Impact Fill (Color between Avg and Student) */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: `${fillStart}%`,
                                                                        width: `${fillWidth}%`,
                                                                        height: '100%',
                                                                        backgroundColor: impactColor,
                                                                        opacity: 0.3,
                                                                        borderRadius: fillStart === 0 && fillWidth === 100 ? '6px' : 
                                                                                      fillStart === 0 ? '6px 0 0 6px' : 
                                                                                      fillStart + fillWidth >= 100 ? '0 6px 6px 0' : '0'
                                                                    }} />
                                                                    
                                                                    {/* Average Marker */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: `${avgPos}%`,
                                                                        top: '-6px',
                                                                        bottom: '-6px',
                                                                        width: '2px',
                                                                        backgroundColor: '#9ca3af',
                                                                        zIndex: 1
                                                                    }} />
                                                                    
                                                                    {/* Student Value Marker */}
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: `${valPos}%`,
                                                                        top: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        width: '14px',
                                                                        height: '14px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: impactColor,
                                                                        border: '2px solid white',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                                        zIndex: 2
                                                                    }} />
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <strong style={{ width: '120px', color: '#374151' }}>Linked Action:</strong> 
                                                <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
                                                    {linkedAction}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Visual SHAP Graph Section */}
            {profileData?.shap_graph_base64 && (
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6' }}>
                        Visual SHAP Explanation
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                        This waterfall plot visualizes how different features push the model's prediction higher or lower from the base value.
                    </p>
                    <img 
                        src={`data:image/png;base64,${profileData.shap_graph_base64}`} 
                        alt="SHAP Waterfall Graph" 
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                </div>
            )}
        </div>
    );
};

export default StudentProfile;