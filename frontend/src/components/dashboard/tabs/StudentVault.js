import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentVault = ({ students, loading }) => {
    const navigate = useNavigate();
    const [sortOrder, setSortOrder] = useState('highest');

    // Memoize the sorting logic to prevent unnecessary recalculations on re-renders
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            if (sortOrder === 'highest') {
                return b.risk_score - a.risk_score;
            } else {
                return a.risk_score - b.risk_score;
            }
        });
    }, [students, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'highest' ? 'lowest' : 'highest');
    };

    const thStyle = { padding: '12px 16px', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f3f4f6', fontWeight: 'bold', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading students...</div>;
    }

    return (
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
                            <th style={{ ...thStyle, textAlign: 'center' }}>Current G1</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Current G2</th>
                            <th style={{ ...thStyle, textAlign: 'center', backgroundColor: '#e0f2fe', color: '#0369a1' }}>Predicted G3</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Total Absences</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
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
                                    <td style={{ ...tdStyle, fontWeight: '500' }}>{s.student_name}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={badgeStyle}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>threat_intelligence</span>
                                                {(s.risk_category || "UNSCORED").replace(/≡ƒö┤ |≡ƒƒí |≡ƒƒó /g, '')}
                                            </span>
                                            {s.risk_score !== undefined && (
                                                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                                    ({(s.risk_score * 100).toFixed(1)}%)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.G1}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.G2}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center', color: '#2563eb', fontWeight: 'bold', backgroundColor: '#f0f9ff' }}>
                                        {s.predicted_g3 || '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.absences}</td>
                                    <td style={{ ...tdStyle, textAlign: 'center' }}>
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
    );
};

export default StudentVault;