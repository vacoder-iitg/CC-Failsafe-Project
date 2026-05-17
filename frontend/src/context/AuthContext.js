import React, { createContext, useState } from 'react';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Initialize state by checking localStorage first
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (username, password, role) => {
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);

        // 2. Create the user object using the explicit username from the backend
        const userData = { username: data.username, role: data.role, token: data.token };

        // 3. Save to React state AND to the browser's permanent storage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token); // Saving token separately makes API calls easier
    };

    const signup = async (username, password, role = 'Faculty') => {
        const response = await fetch('http://localhost:8000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail);

        // Auto-login after successful signup using the JWT provided by the backend
        const userData = { username: data.username, role: data.role, token: data.token };

        // Save to React state AND to the browser's permanent storage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
    };

    const logout = () => {
        // 4. Clear the React state AND wipe the browser's permanent storage
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};