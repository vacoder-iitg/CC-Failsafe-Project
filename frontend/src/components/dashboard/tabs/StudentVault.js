import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentVault = ({ students, loading }) => {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('highest');

    const sortedStudents = useMemo(() => 
        [...students].sort((a, b) => sortOrder === 'highest' ? b.risk_score - a.risk_score : a.risk_score - b.risk_score)
    , [students, sortOrder]);

    const getBadgeStyle = (cat = '') => {
        const isHigh = cat.includes('HIGH');
        const isMod = cat.includes('MODERATE');
        return {
            padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold',
            display: 'inline-flex', alignItems: 'center',
            backgroundColor: isHigh ? '#fee2e2' : isMod ? '#fef3c7' : '#d1fae5',
            color: isHigh ? '#b91c1c' : isMod ? '#d97706' : '#047857'
        };
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading students...</div>;

    return (
        <div style={{ marginTop: '30px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Student Vault ({students.length})</h3>
                {students.length > 0 && (
                    <button
                        onClick={() => setSortOrder(prev => prev === 'highest' ? 'lowest' : 'highest')}
                        style={{ padding: '8px 16px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_vert</span>
                        Sort: {sortOrder === 'highest' ? 'Highest Risk First' : 'Lowest Risk First'}
                    </button>
                )}
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table className="vault-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Risk Tier</th>
                            <th style={{ textAlign: 'center' }}>Current G1</th>
                            <th style={{ textAlign: 'center' }}>Current G2</th>
                            <th style={{ textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1' }}>Predicted G3</th>
                            <th style={{ textAlign: 'center' }}>Total Absences</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStudents.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: '500' }}>{s.student_name}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={getBadgeStyle(s.risk_category)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>threat_intelligence</span>
                                            {s.risk_category || "UNSCORED"}
                                        </span>
                                        {s.risk_score !== undefined && <span style={{ fontSize: '11px', color: '#6b7280' }}>({(s.risk_score * 100).toFixed(1)}%)</span>}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>{s.G1}</td>
                                <td style={{ textAlign: 'center' }}>{s.G2}</td>
                                <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>{s.predicted_g3 || '-'}</td>
                                <td style={{ textAlign: 'center' }}>{s.absences}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button onClick={() => navigate(`/student/${s.id}`)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                        Insights →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Your vault is empty. Go to Data & Settings to upload a CSV and get started!</div>
                )}
            </div>
        </div>
    );
};

export default StudentVault;