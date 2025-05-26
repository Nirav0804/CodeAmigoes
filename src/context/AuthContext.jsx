import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const AuthContext = createContext(null);

// ✅ AuthProvider
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE}/api/users/me`, { withCredentials: true })
            .then((res) => {
                setUser(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching user:', err);
                setUser(null);
                setLoading(false);
            });
    }, []); // ✅ useEffect should only run once — not depend on children

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ Custom Hook: useAuth
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");

    const { user, setUser, loading } = context;

    console.log(user);

    // Optional: provide safely destructured values only if user exists
    const userId = user?.id;
    const username = user?.username;
    const status = user?.status;
    const email = user?.email;
    console.log(userId, username, status, email);

    return {
        userId,
        username,
        status,
        email,
    };
};
