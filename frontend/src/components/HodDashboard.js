import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Imports the pure core engine

const HodDashboard = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null); // Keeps track of the chart so we don't draw duplicates

    const stats = [
        { label: 'Total Students Scanned', value: '450', color: '#1f2937' },
        { label: 'Currently At Risk', value: '15', color: '#b91c1c' },
        { label: 'Interventions Deployed', value: '38', color: '#059669' },
        { label: 'Success Rate', value: '82%', color: '#2563eb' }
    ];

    // Manually build the chart when the page loads
    useEffect(() => {
        // If a chart already exists, destroy it before redrawing
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const myChartRef = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(myChartRef, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 4', 'Week 8', 'Week 12', 'Week 16'],
                datasets: [{
                    label: 'Students At Risk',
                    data: [12, 28, 45, 32, 15],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // Smooth curves
                    pointRadius: 5,
                    pointBackgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: '#f3f4f6' }
                    },
                    x: { 
                        grid: { display: false }
                    }
                }
            }
        });

        // Cleanup function when the user leaves the page
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []); // Empty array means this only runs once when the dashboard opens

    return (
        <div style={{ padding: '20px' }}>
            {/* Top Stats Cards */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ flex: 1, padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{stat.label}</p>
                        <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: stat.color }}>{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Main Trend Chart */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '30px' }}>
                <h3 style={{ marginTop: 0, color: '#1f2937' }}>Departmental Risk Trend</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Monitoring the number of flagged students over the current semester.</p>
                
                {/* VANILLA HTML CANVAS */}
                <div style={{ width: '100%', height: '350px', position: 'relative' }}>
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>

            {/* Recent Interventions Summary */}
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ marginTop: 0, color: '#1f2937' }}>Recent Interventions</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
                    <thead>
                        <tr style={{ color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>
                            <th style={{ paddingBottom: '10px' }}>Instructor</th>
                            <th style={{ paddingBottom: '10px' }}>Action Taken</th>
                            <th style={{ paddingBottom: '10px' }}>Date</th>
                            <th style={{ paddingBottom: '10px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '14px' }}>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 0' }}>Prof. Sharma</td>
                            <td style={{ padding: '12px 0' }}>Mandatory Counseling (ID: 104)</td>
                            <td style={{ padding: '12px 0' }}>April 14, 2026</td>
                            <td style={{ padding: '12px 0', color: '#059669', fontWeight: 'bold' }}>Active</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '12px 0' }}>Prof. Das</td>
                            <td style={{ padding: '12px 0' }}>Peer Tutoring Enrollment (ID: 112)</td>
                            <td style={{ padding: '12px 0' }}>April 12, 2026</td>
                            <td style={{ padding: '12px 0', color: '#059669', fontWeight: 'bold' }}>Active</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HodDashboard;