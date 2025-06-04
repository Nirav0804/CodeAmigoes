import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';
import GradientBackground from '../components/background/GradientBackground';
function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);

    // Display a loading spinner while checking authentication status
    if (loading) {
        return (
            <GradientBackground>
                <div className="min-h-screen flex items-center justify-center text-white">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-t-transparent border-blue-400 rounded-full animate-spin" />
                        <p className="mt-4 text-lg animate-pulse">Loading...</p>
                    </div>
                </div>
            </GradientBackground>
        );
    }

    // Redirect to home if user is not authenticated
    if (!user) {
        return <Navigate to="/" />;
    }

    // Render protected content if authenticated
    return children;
}

export default ProtectedRoute;