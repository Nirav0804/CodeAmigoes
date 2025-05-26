// ProtectedRoute.js
import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" />;
    }

    return children;
}

export default ProtectedRoute;
