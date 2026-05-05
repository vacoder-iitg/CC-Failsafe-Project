import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CsvUpload from '../CsvUpload';
import ClassOverview from './tabs/ClassOverview';
import StudentVault from './tabs/StudentVault';
import GlobalRiskFactors from './tabs/GlobalRiskFactors';

const FacultyDashboard = React.memo(({ students, loading, classInsights, loadingInsights, fetchStudents, user }) => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('failsafe_tab') || 'overview');
    const [globalTabCache, setGlobalTabCache] = useState({});

    useEffect(() => { localStorage.setItem('failsafe_tab', activeTab); }, [activeTab]);

    const handleUploadSuccess = useCallback(() => {
        setGlobalTabCache({});
        fetchStudents();
    }, [fetchStudents]);

    const navTabs = useMemo(() => [
        { id: 'overview', icon: 'school', label: 'Class Overview' },
        { id: 'vault', icon: 'groups', label: 'Student Vault' },
        { id: 'global', icon: 'threat_intelligence', label: 'Global Risk Factors', fontSize: '22px' },
        { id: 'settings', icon: 'settings', label: 'Data & Settings' }
    ], []);

    const tabComponents = {
        overview: <ClassOverview classInsights={classInsights} loadingInsights={loadingInsights} user={user} />,
        vault: <StudentVault students={students} loading={loading} />,
        global: <GlobalRiskFactors classInsights={classInsights} loadingInsights={loadingInsights} user={user} sharedCache={globalTabCache} setSharedCache={setGlobalTabCache} />,
        settings: (
            <div>
                <h3 style={{ marginBottom: '16px', color: '#374151' }}>System Data & Administration</h3>
                <CsvUpload onUploadSuccess={handleUploadSuccess} />
            </div>
        )
    };

    return (
        <div style={{ padding: '20px' }}>
            <style>{`
                .dashboard-tab { padding: 12px 16px; background: none; border: none; color: #6b7280; cursor: pointer; font-size: 16px; position: relative; transition: all 0.3s ease; outline: none; border-radius: 8px 8px 0 0; }
                .dashboard-tab:hover:not(.active) { color: #1f2937; background-color: rgba(243,244,246,0.7); transform: translateY(-2px); }
                .dashboard-tab:active { transform: scale(0.95); }
                .dashboard-tab.active { color: #3b82f6; font-weight: bold; }
                .dashboard-tab::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 3px; background-color: #3b82f6; transition: all 0.3s ease; transform: translateX(-50%); border-radius: 3px 3px 0 0; }
                .dashboard-tab.active::after { width: 100%; }
                .dashboard-tab:hover:not(.active)::after { width: 40%; background-color: #d1d5db; }
                .tab-content-container { animation: fadeInTab 0.4s ease-out; }
                @keyframes fadeInTab { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

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
                        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', marginRight: '6px', fontSize: tab.fontSize || '20px' }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT - Hidden via CSS to prevent unmount lag */}
            <div className="tab-content-container">
                {Object.keys(tabComponents).map(tabId => (
                    <div key={tabId} style={{ display: activeTab === tabId ? 'block' : 'none' }}>
                        {tabComponents[tabId]}
                    </div>
                ))}
            </div>
        </div>
    );
});

export default FacultyDashboard;
