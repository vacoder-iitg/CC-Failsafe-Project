import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentTable = () => {
    const navigate = useNavigate();

    // We've updated the mock data to use the exact keys from your backend dataset!
    // We added 'id' and 'name' since the real backend will likely append those.
    const mockStudents = [
        { 
            id: 101, name: 'Alex Johnson', 
            age: 16, absences: 2, studytime: 3, failures: 0, G3: 18, // High performer
            riskScore: 12, riskLevel: 'Low' 
        },
        { 
            id: 102, name: 'Samira Khan', 
            age: 17, absences: 14, studytime: 2, failures: 0, G3: 11, // Borderline
            riskScore: 45, riskLevel: 'Medium' 
        },
        { 
            id: 103, name: 'Marcus Trent', 
            age: 18, absences: 26, studytime: 1, failures: 2, G3: 6, // High risk
            riskScore: 85, riskLevel: 'High' 
        },
        { 
            id: 104, name: 'Priya Sharma', 
            age: 17, absences: 32, studytime: 1, failures: 3, G3: 4, // Critical
            riskScore: 94, riskLevel: 'Critical' 
        },
    ];

    const getBadgeColor = (level) => {
        switch (level) {
            case 'Low': return { bg: '#d1fae5', text: '#065f46' };
            case 'Medium': return { bg: '#fef3c7', text: '#92400e' };
            case 'High': return { bg: '#fee2e2', text: '#b91c1c' };
            case 'Critical': return { bg: '#f87171', text: '#7f1d1d' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    return (
        <div style={{ marginTop: '30px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>Student Risk Overview</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                    Al predictions based on {mockStudents.length} student records from the latest dataset.
                </p>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '13px', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Student</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Absences</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Study Time</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Past Failures</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Grade (G3)</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>AI Risk Score</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Risk Level</th>
                            <th style={{ padding: '12px 20px', borderBottom: '2px solid #e5e7eb' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockStudents.map((student) => {
                            const colors = getBadgeColor(student.riskLevel);
                            return (
                                <tr key={student.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#111827' }}>
                                        {student.name} <br/>
                                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>Age: {student.age}</span>
                                    </td>
                                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>{student.absences}</td>
                                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>Level {student.studytime}</td>
                                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>{student.failures}</td>
                                    <td style={{ padding: '16px 20px', color: '#4b5563', fontWeight: 'bold' }}>{student.G3}/20</td>
                                    <td style={{ padding: '16px 20px', color: '#4b5563' }}>{student.riskScore}%</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ 
                                            backgroundColor: colors.bg, 
                                            color: colors.text, 
                                            padding: '4px 12px', 
                                            borderRadius: '9999px', 
                                            fontSize: '12px', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {student.riskLevel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <button 
                                            onClick={() => navigate(`/student/${student.id}`)}
                                            style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                                            View Insights
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentTable;