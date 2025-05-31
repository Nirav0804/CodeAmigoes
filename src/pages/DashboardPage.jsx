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
  // const [user, setUser] = useState("");
  const { username, userId, status } = useAuth();
  // useEffect(() => {
  //   const username = searchParams.get("username");
  //   const id = searchParams.get("userId");
  //   const githubUsername = searchParams.get("githubUsername");
  //   const status = searchParams.get("status");
  //   localStorage.setItem("username", username);
  //   localStorage.setItem("userId", id);
  //   localStorage.setItem("githubUsername", githubUsername);
  //   localStorage.setItem("status", status);
  //   setUser(username);
  // }, [searchParams]);



  // useEffect(() => {
  //   // Get the username from localStorage or from a global state if stored after login
  //   // const username = localStorage.getItem("username"); // or from context or redux

  //   if (!username) {
  //     // If no username found in localStorage, redirect to login
  //     navigate("/landingPage");
  //   }
  // }, [navigate]);

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
