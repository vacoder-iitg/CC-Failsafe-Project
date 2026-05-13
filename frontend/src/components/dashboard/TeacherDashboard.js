import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CsvUpload from '../CsvUpload';
import ClassOverview from './tabs/ClassOverview';
import StudentVault from './tabs/StudentVault';
import GlobalRiskFactors from './tabs/GlobalRiskFactors';

const TeacherDashboard = React.memo(({ students, loading, classInsights, loadingInsights, fetchStudents, user }) => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('failsafe_tab') || 'overview');
    // Cache for GlobalRiskFactors so it doesn't recalculate ML models when switching tabs
    const [globalTabCache, setGlobalTabCache] = useState({});

    useEffect(() => { localStorage.setItem('failsafe_tab', activeTab); }, [activeTab]);

    const handleUploadSuccess = useCallback(() => {
        setGlobalTabCache({}); // Clear cache on new data
        fetchStudents();
    }, [fetchStudents]);

    const navTabs = useMemo(() => [
        { id: 'overview', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>school</span>Class Overview</> },
        { id: 'vault', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>groups</span>Student Vault</> },
        { id: 'global', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px', fontSize: '22px' }}>threat_intelligence</span>Global Risk Factors</> },
        { id: 'settings', label: <><span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px' }}>settings</span>Data & Settings</> }
    ], []);

    return (
        <div style={{ padding: '20px' }}>
            <style>
                {`
                .dashboard-tab {
                    padding: 12px 16px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s ease-in-out;
                    outline: none;
                }
                .dashboard-tab:hover:not(.active) {
                    color: #4b5563;
                    background-color: #f3f4f6;
                    border-radius: 4px 4px 0 0;
                }
                .dashboard-tab.active {
                    border-bottom: 3px solid #3b82f6;
                    color: #111827;
                    font-weight: bold;
                }
                .tab-content-container {
                    animation: fadeInTab 0.3s ease-out;
                }
                @keyframes fadeInTab {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#111827' }}>Teacher Dashboard</h2>
            </div>

            {/* Navigation Bar */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                {navTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT - Hidden via CSS to prevent unmount lag */}
            <div className="tab-content-container">
                {/* TAB CONTENT: Data & Settings */}
                <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>System Data & Administration</h3>
                    <CsvUpload onUploadSuccess={handleUploadSuccess} />
                </div>

                {/* TAB CONTENT: Class Overview */}
                <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                    <ClassOverview
                        classInsights={classInsights}
                        loadingInsights={loadingInsights}
                        user={user}
                    />
                </div>

                {/* TAB CONTENT: Global Risk Factors */}
                <div style={{ display: activeTab === 'global' ? 'block' : 'none' }}>
                    <GlobalRiskFactors
                        classInsights={classInsights}
                        loadingInsights={loadingInsights}
                        user={user}
                        sharedCache={globalTabCache}
                        setSharedCache={setGlobalTabCache}
                    />
                </div>

                {/* TAB CONTENT: Student Vault */}
                <div style={{ display: activeTab === 'vault' ? 'block' : 'none' }}>
                    <StudentVault
                        students={students}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
});

export default TeacherDashboard;