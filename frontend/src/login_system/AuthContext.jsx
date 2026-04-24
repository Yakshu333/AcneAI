import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('login_system_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email, password) => {
        const res = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw data.detail || data.error || 'Login failed';
        }
        setUser(data.user);
        localStorage.setItem('login_system_user', JSON.stringify(data.user));
        return data.user;
    };

    const signup = async (name, email, password) => {
        const res = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            throw data.detail || data.error || 'Registration failed';
        }
        setUser(data.user);
        localStorage.setItem('login_system_user', JSON.stringify(data.user));
        return data.user;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('login_system_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
