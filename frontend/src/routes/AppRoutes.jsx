import { BrowserRouter as Router, Routes, Route, Navigate, } from 'react-router-dom';
import React, { useContext } from 'react';
import App from '../App';
import RegistrationForm from '../components/forms/RegistrationForm';
import LoginForm from '../components/forms/LoginForm';
import DashboardPage from '../pages/DashboardPage';
import SubscriptionPlans from '../components/navigation/SubscriptionPlans';
import ProfilePage from '../pages/ProfilePage';
import HackathonPage from '../pages/HackathonPage';
import HackathonRegistrationForm from '../components/forms/HackathonRegistrationForm';
import HackathonDetailsPage from '../pages/HackathonDetailsPage';
import HackathonRequestPage from '../pages/HackathonRequestPage';
import HackathonRequestStatusPage from '../pages/HackathonRequestStatusPage';
import ProfileEditForm from '../components/forms/ProfileEditForm';
import ChatDropDown from '../components/Chat/ChatDropDown';
import ProtectedRoute from '../context/ProtectedRoutes';
import { useAuth } from '../context/AuthContext';
import UserFetcherOnRouteChange from '../context/UserFetchOnRouteChange';
function AppRoutes() {
    const { userId, status } = useAuth();
    return (

        <Router>
            <UserFetcherOnRouteChange />
            <Routes>
                <Route path="/register" element={<RegistrationForm />} />
                <Route
                    path="/"
                    element={
                        userId ? <Navigate to="/dashboard" replace /> : <App />
                    }
                />
                <Route
                    path="/subscription"
                    element={
                        <ProtectedRoute >
                            <SubscriptionPlans />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/profile/:username"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/profile/:username/edit"
                    element={
                        <ProtectedRoute>
                            <ProfileEditForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/hackathons"
                    element={
                        <ProtectedRoute>
                            <HackathonPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/hackathons/add"
                    element={
                        <ProtectedRoute>
                            <HackathonRegistrationForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/hackathons/:id"
                    element={
                        <ProtectedRoute>
                            <HackathonDetailsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/hackathons/requests"
                    element={
                        <ProtectedRoute>
                            <HackathonRequestPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/hackathons/requests/status"
                    element={
                        <ProtectedRoute>
                            <HackathonRequestStatusPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/chat"
                    element={
                        <ProtectedRoute>
                            <ChatDropDown />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*"
                    element={userId ? <Navigate to="/dashboard" /> : <App />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
