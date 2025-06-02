import React from "react";
import Navigation from "../components/navigation/Navigation";
import GradientBackground from "../components/background/GradientBackground";
import Welcome from "../components/body/Welcome";
import Footer from "../components/footer/Footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/chatbot/Chatbot";
const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { username, userId, status } = useAuth();
  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <Welcome text={username} />
      <Chatbot/>
      <Footer />
    </GradientBackground>
  );
};

export default DashboardPage;
