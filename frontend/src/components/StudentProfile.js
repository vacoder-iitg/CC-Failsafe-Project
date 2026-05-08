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

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Running Deep AI Analysis...</h2></div>;

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
                    <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>{riskTier}</p>
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
                                : (isHigh ? '#0369a1' : '#38bdf8'); 
                            const bgColor = isRisk 
                                ? (isHigh ? '#fef2f2' : '#fff1f2') 
                                : (isHigh ? '#f0f9ff' : '#e0f2fe');
                            
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
                                                <span style={{ color: impactColor, marginRight: '8px', fontSize: '18px' }}>
                                                    {isRisk ? '↑!' : '↓'}
                                                </span>
                                                [{driver?.feature || "Unknown Feature"}]
                                            </div>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: impactColor, backgroundColor: bgColor, padding: '4px 10px', borderRadius: '12px' }}>
                                                {impactText}
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6', marginLeft: '24px' }}>
                                            <div style={{ display: 'flex', marginBottom: '4px' }}>
                                                <strong style={{ width: '120px', color: '#374151' }}>Data Context:</strong> 
                                                <span>{rawString.replace(/_/g, ' ')}: {driver?.raw_student_value ?? 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
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