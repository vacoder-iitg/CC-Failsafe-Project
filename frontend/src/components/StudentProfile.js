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
        .catch(() => setLoading(false));
    }, [id, user]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><h2>Running Deep AI Analysis...</h2></div>;

    if (!profileData || !profileData.student_info) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                <h2>Student Data Not Available</h2>
                <p>Could not load insights. They may belong to another user.</p>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            </div>
        );
    }

    const { student_info, recommended_actions } = profileData;

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← Back to Dashboard</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{student_info.name}</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>Student ID: {id} | Age: {student_info.age}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '32px', color: student_info.risk_tier === '🔴 HIGH' ? '#b91c1c' : student_info.risk_tier === '🟡 MODERATE' ? '#b45309' : '#047857' }}>{student_info.at_risk_probability}</h2>
                    <p style={{ margin: 0, color: '#6b7280', fontWeight: 'bold' }}>{student_info.risk_tier} RISK</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>Academic & Behavioral Profile</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>CURRENT G1</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: student_info.current_g1 < 10 ? '#ef4444' : '#1f2937' }}>{student_info.current_g1}/20</span>
                        </div>
                        <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>PREDICTED G3</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d' }}>{student_info.predicted_g3}/20</span>
                        </div>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>FAILURES</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: student_info.past_failures > 0 ? '#ef4444' : '#1f2937' }}>{student_info.past_failures}</span>
                        </div>
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>ABSENCES</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: student_info.total_absences > 5 ? '#ef4444' : '#1f2937' }}>{student_info.total_absences}</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>AI Interventions</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        {recommended_actions?.map((step, idx) => <li key={idx} style={{ marginBottom: '14px' }}>{step}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;