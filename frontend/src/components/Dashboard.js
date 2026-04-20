import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CsvUpload from './CsvUpload';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

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
    };

    useEffect(() => { 
        if (user) fetchStudents(); 
    }, [user]);

    const thStyle = { padding: '12px 16px', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f3f4f6', fontWeight: 'bold', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1f2937' }}>FAILSAFE Dashboard</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
                        Logged in as: <strong style={{ color: '#2563eb' }}>{user?.username}</strong>
                    </p>
                </div>
                <button onClick={logout} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sign Out</button>
            </div>

            <CsvUpload onUploadSuccess={fetchStudents} />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}><h3>Loading secure vault...</h3></div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', marginTop: '20px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                        <h2 style={{ margin: 0, color: '#1f2937' }}>Private Student Roster</h2>
                        <span style={{ fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 12px', borderRadius: '999px' }}>{students.length} Records</span>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Student</th>
                                    <th style={thStyle}>Risk Score</th>
                                    <th style={thStyle}>Risk Category</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>G1</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Predicted G3</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Absences</th>
                                    <th style={{...thStyle, textAlign: 'center'}}>Analysis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    let badgeStyle = { padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
                                    if (s.risk_category === '🔴 HIGH') badgeStyle = { ...badgeStyle, backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' };
                                    else if (s.risk_category === '🟡 MODERATE') badgeStyle = { ...badgeStyle, backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' };
                                    else badgeStyle = { ...badgeStyle, backgroundColor: '#d1fae5', color: '#047857', border: '1px solid #6ee7b7' };

                                    return (
                                        <tr key={s.id}>
                                            <td style={{...tdStyle, fontWeight: 'bold', color: '#1f2937'}}>{s.student_name}</td>
                                            <td style={{...tdStyle, fontFamily: 'monospace'}}>
                                                {s.risk_score !== null ? (s.risk_score * 100).toFixed(1) + '%' : 'Pending'}
                                            </td>
                                            <td style={tdStyle}><span style={badgeStyle}>{s.risk_category || "UNSCORED"}</span></td>
                                            <td style={{...tdStyle, textAlign: 'center'}}>{s.G1}</td>
                                            <td style={{...tdStyle, textAlign: 'center', color: '#2563eb', fontWeight: 'bold'}}>{s.predicted_g3 || '-'}</td>
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
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Your vault is empty. Upload a CSV to get started!</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;