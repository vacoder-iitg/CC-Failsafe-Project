import React, { useState, useEffect } from 'react';
import CsvUpload from '../CsvUpload';
import ClassOverview from './tabs/ClassOverview';
import StudentVault from './tabs/StudentVault';
import GlobalRiskFactors from './tabs/GlobalRiskFactors';

const TeacherDashboard = ({ students, loading, classInsights, loadingInsights, fetchStudents, user }) => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('failsafe_tab') || 'overview');

    useEffect(() => { localStorage.setItem('failsafe_tab', activeTab); }, [activeTab]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#111827' }}>Teacher Dashboard</h2>
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
                <ClassOverview 
                    classInsights={classInsights} 
                    loadingInsights={loadingInsights} 
                    user={user} 
                />
            )}

            {/* TAB CONTENT: Global Risk Factors */}
            {activeTab === 'global' && (
                <GlobalRiskFactors 
                    classInsights={classInsights} 
                    loadingInsights={loadingInsights} 
                    user={user} 
                />
            )}

            {/* TAB CONTENT: Student Vault */}
            {activeTab === 'vault' && (
                <StudentVault 
                    students={students} 
                    loading={loading} 
                />
            )}
        </div>
    );
};

export default TeacherDashboard;
