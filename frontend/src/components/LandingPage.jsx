import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: '#1e293b',
            backgroundImage: 'url("auth-bg.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh'
        }}>
            {/* Navigation */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 8%',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '24px' }}>shield</span>
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#0f172a' }}>FAILSAFE</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#0f172a',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '15px'
                        }}
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '15px',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        Get Started
                    </button>

                </div>
            </nav>

            {/* Hero Section - What is FAILSAFE */}
            <section style={{
                padding: '160px 8% 80px',
                textAlign: 'left'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '60px',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(20px)',
                    padding: '60px',
                    borderRadius: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            fontSize: '48px',
                            fontWeight: '900',
                            letterSpacing: '-0.04em',
                            lineHeight: '1.2',
                            marginBottom: '24px',
                            color: '#0f172a'
                        }}>
                            What is <span style={{ color: '#6366f1' }}>FAILSAFE</span>?
                        </h1>
                        <p style={{
                            fontSize: '18px',
                            color: '#334155',
                            lineHeight: '1.6',
                            fontWeight: '500',
                            margin: 0
                        }}>
                            FAILSAFE is an intelligent early-warning system designed to prevent academic failure.
                            By leveraging advanced machine learning algorithms, we analyze student performance indicators
                            in real-time to identify those at risk. Our platform doesn't just predict—it empowers faculty
                            with actionable insights to intervene effectively and build a brighter future for every student.

                        </p>
                    </div>

                    {/* Minimized & Integrated GIF */}
                    <div style={{
                        flex: '0 0 350px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        border: '4px solid rgba(255, 255, 255, 0.8)'
                    }}>
                        <img
                            src="https://cdn.dribbble.com/users/980520/screenshots/2859415/monitoring.gif"
                            alt="Monitoring Data"
                            style={{ width: '100%', display: 'block' }}
                        />
                    </div>
                </div>
            </section>


            {/* Features Section - How FAILSAFE Empowers Professors */}
            <section style={{
                padding: '80px 8%',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a' }}>How FAILSAFE Empowers Faculty</h2>
                    <p style={{ color: '#475569', fontSize: '18px', fontWeight: '600' }}>Data-driven tools to improve academic outcomes.</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {[
                        {
                            title: 'Early Detection',
                            desc: 'Identify students at risk of academic failure weeks before exams using advanced ML models trained on past student performance.',
                            icon: 'radar'
                        },
                        {
                            title: 'Actionable Insights',
                            desc: 'Don\'t just see the risk—understand why. Our "Take Action" engine provides specific recommendations like remedial classes or counseling.',
                            icon: 'lightbulb'
                        },
                        {
                            title: 'HoD Oversight',
                            desc: 'Heads of Departments can monitor overall batch health and send direct feedback to faculty members to ensure no student is missed.',
                            icon: 'visibility'
                        }
                    ].map((feature, i) => (
                        <div key={i} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            padding: '40px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                backgroundColor: '#f5f3ff',
                                color: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>{feature.icon}</span>
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>{feature.title}</h3>
                            <p style={{ color: '#334155', lineHeight: '1.6', fontWeight: '500' }}>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '60px 8%',
                textAlign: 'center',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '600'
            }}>
                &copy; 2026 FAILSAFE Intelligence Platform. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;

