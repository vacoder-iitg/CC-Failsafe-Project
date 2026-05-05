import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentActionCard = React.memo(({ s, actions, isExpanded, onToggleExpand, navigate }) => {
    const isHigh = s.risk_category === 'HIGH';
    const isMod = s.risk_category === 'MODERATE';
    const riskColor = isHigh ? '#ef4444' : isMod ? '#f59e0b' : '#10b981';
    const riskBg = isHigh ? '#fef2f2' : isMod ? '#fffbeb' : '#ecfdf5';
    const riskIcon = isHigh ? 'emergency_home' : isMod ? 'warning' : 'check_circle';
    const highPriorityCount = actions.filter(a => a.priority === 'high').length;

    return (
        <div 
            className="action-student-card" 
            style={{ borderLeft: `4px solid ${riskColor}` }}
        >
            {/* Student header row — always visible */}
            <div
                onClick={() => onToggleExpand(s.id)}
                className="action-student-header"
            >
                {/* Name + Risk */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>{s.student_name}</span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '9999px',
                            backgroundColor: riskBg, color: riskColor,
                            fontSize: '11px', fontWeight: '700'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{riskIcon}</span>
                            {s.risk_category || 'UNSCORED'}
                        </span>
                        {s.risk_score !== undefined && (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>({(s.risk_score * 100).toFixed(1)}%)</span>
                        )}
                    </div>
                </div>

                {/* Grade pills */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {[{ l: 'G1', v: s.G1 }, { l: 'G2', v: s.G2 }, { l: 'PG3', v: s.predicted_g3 || '—' }].map(g => (
                        <div key={g.l} style={{ textAlign: 'center', minWidth: '44px' }}>
                            <div style={{ fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '600' }}>{g.l}</div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: g.l === 'PG3' ? '#2563eb' : '#374151' }}>{g.v}</div>
                        </div>
                    ))}
                </div>

                {/* Action count badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {highPriorityCount > 0 && (
                        <span style={{
                            backgroundColor: '#ef4444', color: 'white',
                            fontSize: '10px', fontWeight: '800',
                            borderRadius: '9999px', padding: '2px 8px'
                        }}>
                            {highPriorityCount} urgent
                        </span>
                    )}
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                        {actions.length} action{actions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                </div>
            </div>

            {/* Expanded action list */}
            {isExpanded && (
                <div style={{ padding: '0 20px 18px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '14px' }}>
                        {actions.map((a, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '12px 14px', backgroundColor: a.bg,
                                borderRadius: '8px', border: `1px solid ${a.color + '22'}`,
                                transition: 'all 0.2s'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: a.color, flexShrink: 0, marginTop: '1px' }}>{a.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827', marginBottom: '2px' }}>{a.label}</div>
                                    <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>{a.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick link */}
                    <div style={{ marginTop: '12px', textAlign: 'right' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/student/${s.id}`); }}
                            className="profile-quick-link-btn"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                            Full Student Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    return prev.isExpanded === next.isExpanded && prev.s === next.s;
});

const TakeAction = React.memo(({ students, loading }) => {
    const navigate = useNavigate();
    const [expandedStudent, setExpandedStudent] = useState(null);

    const handleToggleExpand = useCallback((id) => {
        setExpandedStudent(prev => prev === id ? null : id);
    }, []);

    const processedStudents = useMemo(() => {
        const getStudentActions = (s) => {
            const actions = [];
            if (s.G1 !== undefined && s.G1 < 10) actions.push({ icon: 'menu_book', color: '#ef4444', bg: '#fef2f2', label: 'Low G1 Score', desc: 'Provide personal tutor for weak subjects', priority: 'high' });
            if (s.G2 !== undefined && s.G2 < 10) actions.push({ icon: 'menu_book', color: '#ef4444', bg: '#fef2f2', label: 'Low G2 Score', desc: 'Assign remedial classes & practice tests', priority: 'high' });
            if (s.failures && s.failures >= 1) actions.push({ icon: 'school', color: '#dc2626', bg: '#fef2f2', label: `${s.failures} Past Failure(s)`, desc: 'Enroll in academic recovery program', priority: 'high' });
            if (s.studytime !== undefined && s.studytime <= 1) actions.push({ icon: 'schedule', color: '#f59e0b', bg: '#fffbeb', label: 'Very Low Study Time', desc: 'Provide supervised extra study hours in school', priority: 'medium' });
            if (s.absences !== undefined && s.absences > 10) actions.push({ icon: 'event_busy', color: '#ef4444', bg: '#fef2f2', label: `High Absences (${s.absences})`, desc: 'Formal warning to student & parents about attendance policy', priority: 'high' });
            else if (s.absences !== undefined && s.absences > 5) actions.push({ icon: 'event_busy', color: '#f59e0b', bg: '#fffbeb', label: `Moderate Absences (${s.absences})`, desc: 'Counsel student about attendance importance', priority: 'medium' });
            if (s.health !== undefined && s.health <= 2) actions.push({ icon: 'local_hospital', color: '#ef4444', bg: '#fef2f2', label: 'Health Concerns', desc: 'Recommend consultation with school doctor', priority: 'high' });
            if ((s.Dalc && s.Dalc >= 3) || (s.Walc && s.Walc >= 3)) actions.push({ icon: 'no_drinks', color: '#dc2626', bg: '#fef2f2', label: 'High Alcohol Consumption', desc: 'Refer to school counselor for substance awareness', priority: 'high' });
            if (s.goout !== undefined && s.goout >= 4) actions.push({ icon: 'groups', color: '#f59e0b', bg: '#fffbeb', label: 'High Social Activity', desc: 'Monitor social time, suggest balanced routine', priority: 'low' });
            if (s.freetime !== undefined && s.freetime >= 4) actions.push({ icon: 'sports_esports', color: '#6b7280', bg: '#f9fafb', label: 'Excessive Free Time', desc: 'Encourage extracurricular/academic engagement', priority: 'low' });
            if (s.famsup === 'no') actions.push({ icon: 'family_restroom', color: '#8b5cf6', bg: '#f5f3ff', label: 'No Family Support', desc: 'Schedule parent-faculty meeting to engage family', priority: 'medium' });
            if (s.schoolsup === 'no' && (s.G1 < 10 || s.G2 < 10)) actions.push({ icon: 'support_agent', color: '#3b82f6', bg: '#eff6ff', label: 'No School Support', desc: 'Enroll in school academic support program', priority: 'medium' });
            if (s.higher === 'no') actions.push({ icon: 'trending_up', color: '#6366f1', bg: '#eef2ff', label: 'No Higher Ed. Aspiration', desc: 'Provide career guidance & motivational counseling', priority: 'medium' });
            if (s.romantic === 'yes' && s.studytime <= 2) actions.push({ icon: 'favorite', color: '#ec4899', bg: '#fdf2f8', label: 'Relationship + Low Study', desc: 'Time management workshop', priority: 'low' });
            if ((s.Medu !== undefined && s.Medu <= 1) && (s.Fedu !== undefined && s.Fedu <= 1)) actions.push({ icon: 'escalator_warning', color: '#6b7280', bg: '#f9fafb', label: 'Low Parental Education', desc: 'Additional mentorship from senior students/faculty', priority: 'low' });

            if (actions.length === 0) actions.push({ icon: 'check_circle', color: '#10b981', bg: '#ecfdf5', label: 'No Major Concerns', desc: 'Student appears on track — continue monitoring', priority: 'ok' });
            return actions;
        };

        return [...students]
            .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
            .map(s => ({ ...s, actions: getStudentActions(s) }));
    }, [students]);

    return (
        <div style={{ padding: '28px 32px', backgroundColor: 'transparent', minHeight: '100vh' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#6366f1' }}>bolt</span>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>Take Action</h2>
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px', maxWidth: '700px' }}>
                Prioritized action items for each student based on their risk profile. Students are sorted by risk — highest first.
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading students...</div>
            ) : processedStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d1d5db', display: 'block', marginBottom: '10px' }}>folder_open</span>
                    <p style={{ color: '#6b7280', margin: 0 }}>No students uploaded yet. Go to Dashboard → Data & Settings.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {processedStudents.map(s => (
                        <StudentActionCard
                            key={s.id}
                            s={s}
                            actions={s.actions}
                            isExpanded={expandedStudent === s.id}
                            onToggleExpand={handleToggleExpand}
                            navigate={navigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

export default TakeAction;