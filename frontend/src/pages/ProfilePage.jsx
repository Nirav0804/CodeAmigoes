import React from "react";
import GradientBackground from "../components/background/GradientBackground";
import Navigation from "../components/navigation/Navigation";
import ProfileDashboard from "../components/body/ProfileDashboard";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Chatbot from "../components/chatbot/Chatbot";

const ProfilePage = () => {
  const navigate = useNavigate();
  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <ProfileDashboard />
      <Chatbot/>
    </GradientBackground>
  );
};

export default ProfilePage;