import React from 'react';

const GlobalRiskFactors = React.memo(({ classInsights, loadingInsights }) => {
    
    if (loadingInsights || !classInsights) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px' }}>
                <img 
                    src="https://cdn.dribbble.com/users/980520/screenshots/2859415/monitoring.gif" 
                    alt="AI Analysis" 
                    style={{ width: '160px', marginBottom: '20px', borderRadius: '12px' }}
                />
                <h3 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Deep AI Global Analysis...</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Connecting to ML models for global risk factor extraction.</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <h3 style={{ marginTop: 0, paddingBottom: '10px', color: '#1f2937', borderBottom: '2px solid #f3f4f6', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#6366f1' }}>bar_chart</span>
                    Class-Wide Average Risk Drivers
                </h3>
                <p style={{ color: '#4b5563', fontSize: '14px', maxWidth: '800px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                    Average SHAP impact of each feature across your entire cohort. Features to the <span style={{color: '#e74c3c', fontWeight: 'bold'}}>right</span> increase risk probability; features to the <span style={{color: '#27ae60', fontWeight: 'bold'}}>left</span> are protective.
                </p>
                {classInsights.shap_graph_base64 ? (
                    <img
                        src={`data:image/png;base64,${classInsights.shap_graph_base64}`}
                        alt="Global SHAP Averages Chart"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                ) : <p>No SHAP graph available.</p>}
            </div>
        </div>
    );
});

export default GlobalRiskFactors;
