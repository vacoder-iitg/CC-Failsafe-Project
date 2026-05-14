import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CsvUpload from '../CsvUpload';
import ClassOverview from './tabs/ClassOverview';
import StudentVault from './tabs/StudentVault';
import GlobalRiskFactors from './tabs/GlobalRiskFactors';

const FacultyDashboard = React.memo(({ students, loading, classInsights, loadingInsights, fetchStudents, user }) => {
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
                    color: #6b7280;
                    cursor: pointer;
                    font-size: 16px;
                    position: relative; /* Required for the animated underline */
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                    border-radius: 8px 8px 0 0;
                }

                /* 1. Hover Effect: Slight lift and text color change */
                .dashboard-tab:hover:not(.active) {
                    color: #1f2937;
                    background-color: rgba(243, 244, 246, 0.7);
                    transform: translateY(-2px); 
                }

                /* 2. Click Effect: Tactile press down */
                .dashboard-tab:active {
                    transform: scale(0.95);
                }

                /* 3. Active State */
                .dashboard-tab.active {
                    color: #3b82f6; /* Blue text when active */
                    font-weight: bold;
                }

                /* 4. The Animated Underline (Base State) */
                .dashboard-tab::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    width: 0; /* Starts hidden */
                    height: 3px;
                    background-color: #3b82f6;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    transform: translateX(-50%); /* Keeps it centered */
                    border-radius: 3px 3px 0 0;
                }

                /* 5. Underline expands to 100% when active */
                .dashboard-tab.active::after {
                    width: 100%; 
                }

                /* 6. Subtle gray underline preview on hover */
                .dashboard-tab:hover:not(.active)::after {
                    width: 40%;
                    background-color: #d1d5db;
                }

                /* Container transition (from before) */
                .tab-content-container {
                    animation: fadeInTab 0.4s ease-out;
                }
                
                @keyframes fadeInTab {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#111827' }}>Faculty Dashboard</h2>
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

export default FacultyDashboard;
