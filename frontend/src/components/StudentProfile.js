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
            headers: { 'Authorization': `Bearer ${user?.token}` }
        })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => { setProfileData(data); setLoading(false); })
        .catch(() => setLoading(false));
    }, [id, user]);

    const getActionConfig = (text) => {
        const lower = text.toLowerCase();
        const rules = [
            { keys: ['g1', 'g2'], icon: 'menu_book', color: '#ef4444', bg: '#fef2f2' },
            { keys: ['failure'], icon: 'school', color: '#ef4444', bg: '#fef2f2' },
            { keys: ['absence'], icon: 'event_busy', color: '#f59e0b', bg: '#fffbeb' },
            { keys: ['health'], icon: 'local_hospital', color: '#ef4444', bg: '#fef2f2' },
            { keys: ['alcohol'], icon: 'no_drinks', color: '#ef4444', bg: '#fef2f2' },
            { keys: ['stable', 'concerns'], icon: 'check_circle', color: '#10b981', bg: '#ecfdf5' },
            { keys: ['study'], icon: 'schedule', color: '#f59e0b', bg: '#fffbeb' }
        ];
        return rules.find(r => r.keys.some(k => lower.includes(k))) || { icon: 'info', color: '#3b82f6', bg: '#eff6ff' };
    };

    if (loading) {
        return (
            <div className="loader-container">

                <div className="loader-card">
                    <img src="https://cdn.dribbble.com/users/980520/screenshots/2859415/monitoring.gif" alt="AI Analysis" />
                    <h2>Running Deep AI Analysis...</h2>
                    <p>Please wait while FAILSAFE crunches student metrics and generates real-time risk assessments.</p>
                    <div className="loader-bar"><div className="loader-fill" /></div>
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

    const { student_info, recommended_actions } = profileData;
    const riskTierText = student_info?.risk_tier || 'LOW';
    const isHighRisk = riskTierText === 'HIGH', isModRisk = riskTierText === 'MODERATE';
    const riskColor = isHighRisk ? '#b91c1c' : isModRisk ? '#b45309' : '#047857';

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundImage: 'url("/auth-bg.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh' }}>


            <button onClick={() => navigate('/dashboard')} className="profile-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>Back to Dashboard
            </button>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#111827', fontSize: '28px', fontheight: '800' }}>{student_info?.name || "Unknown Student"}</h1>
                    <p style={{ margin: '6px 0 0', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '500' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>Age: {student_info?.age || "N/A"}
                    </p>
                </div>
                <div>
                    {(() => {
                        const probabilityStr = student_info?.at_risk_probability || "0%";
                        const probabilityVal = parseFloat(probabilityStr.replace('%', '')) || 0;
                        const angle = (probabilityVal / 100) * 180;
                        const gaugeColor = isHighRisk ? '#ef4444' : isModRisk ? '#f59e0b' : '#10b981';

                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ position: 'relative', width: '120px', height: '62px', overflow: 'hidden' }}>
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="#f3f4f6" strokeWidth="10" strokeLinecap="round" />
                                        <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray="141.37" strokeDashoffset={141.37 - (probabilityVal / 100) * 141.37} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                                        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '60px 60px', transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                            <line x1="60" y1="60" x2="20" y2="60" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
                                            <circle cx="60" cy="60" r="5" fill="#374151" />
                                        </g>
                                    </svg>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '32px', fontWeight: '800', color: gaugeColor, lineHeight: 1 }}>{probabilityStr}</span>
                                    <span style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: isHighRisk ? '#fef2f2' : isModRisk ? '#fffbeb' : '#ecfdf5', border: `1px solid ${isHighRisk ? '#fca5a5' : isModRisk ? '#fde68a' : '#a7f3d0'}`, color: gaugeColor, fontSize: '12px', fontWeight: '700' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>threat_intelligence</span>{riskTierText}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Middle Section */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#1f2937' }}>Academic & Behavioral Profile</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        <div className={`stat-card ${(student_info?.current_g1 || 0) < 10 ? 'risk' : ''}`}>
                            <span className="stat-card-title">CURRENT G1</span>
                            <span className="stat-card-val" style={{ color: (student_info?.current_g1 || 0) < 10 ? '#ef4444' : '#1f2937' }}>{student_info?.current_g1 || 0}/20</span>
                        </div>
                        <div className="stat-card safe">
                            <span className="stat-card-title" style={{ color: '#166534' }}>PREDICTED G3</span>
                            <span className="stat-card-val" style={{ color: '#15803d' }}>{student_info?.predicted_g3 || 0}/20</span>
                        </div>
                        <div className={`stat-card ${(student_info?.past_failures || 0) > 0 ? 'risk' : ''}`}>
                            <span className="stat-card-title">FAILURES</span>
                            <span className="stat-card-val" style={{ color: (student_info?.past_failures || 0) > 0 ? '#ef4444' : '#1f2937' }}>{student_info?.past_failures || 0}</span>
                        </div>
                        <div className={`stat-card ${(student_info?.total_absences || 0) > 5 ? 'risk' : ''}`}>
                            <span className="stat-card-title">ABSENCES</span>
                            <span className="stat-card-val" style={{ color: (student_info?.total_absences || 0) > 5 ? '#ef4444' : '#1f2937' }}>{student_info?.total_absences || 0}</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', color: '#1f2937', marginBottom: '16px' }}>AI Recommended Interventions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recommended_actions?.length > 0 ? recommended_actions.map((step, idx) => {
                            const { icon, color, bg } = getActionConfig(step);
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', backgroundColor: bg, borderRadius: '8px', border: `1px solid ${color}15` }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color, flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                                    <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.4' }}>{step}</span>
                                </div>
                            );
                        }) : (
                            <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '14px' }}>No specific actions recommended at this time.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;