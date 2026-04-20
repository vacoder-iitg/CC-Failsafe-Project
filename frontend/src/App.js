import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Notice the updated paths below! We are telling App.js to look inside the folders.
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './components/AuthPage'; 
import Dashboard from './components/Dashboard';
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

                    {/* The locked private routes */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
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