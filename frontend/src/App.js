import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Notice the updated paths below! We are telling App.js to look inside the folders.
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './components/AuthPage'; 
import Dashboard from './components/Dashboard';
import HodDashboard from './components/HodDashboard';
import StudentProfile from './components/StudentProfile';

// The Bouncer Component: Kicks unauthenticated users back to login
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    
    if (!user) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

// The Reverse Bouncer: Keeps logged-in users out of the login page
const AuthWrapper = () => {
    const { user } = useContext(AuthContext);
    if (user) {
        // Route based on role
        if (user.role === 'HoD') {
            return <Navigate to="/hod" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }
    return <AuthPage />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* The public login route */}
                    <Route path="/" element={<AuthWrapper />} />

                    {/* Faculty dashboard */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    {/* HoD dashboard */}
                    <Route 
                        path="/hod" 
                        element={
                            <ProtectedRoute>
                                <HodDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/student/:id" 
                        element={
                            <ProtectedRoute>
                                <StudentProfile />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;