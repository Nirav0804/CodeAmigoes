import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navigation/NavBar";
import GradientBackground from "../components/background/GradientBackground";
import Navigation from "../components/navigation/Navigation";
import { useState, useEffect } from "react";
import VerticalNavBar from "../components/navigation/VerticalNavBar";
import Chatbot from "../components/chatbot/Chatbot";
import { useAuth } from "../context/AuthContext";

const HackathonPage = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  useEffect(() => {
    // const username = localStorage.getItem("username");
    // if (!username) {
    //   navigate("/");
    //   return;
    // }
  
    // Get user's location and store it in localStorage
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          localStorage.setItem("latitude", latitude);
          localStorage.setItem("longitude", longitude);
          console.log(position);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [navigate]);
  

  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <div className="container mx-auto p-4 pt-24 pb-24 overflow-auto h-screen">
        <Navbar
          hackathons={hackathons}
          setFilteredHackathons={setFilteredHackathons}
        />
        <VerticalNavBar
          setHackathons={setHackathons}
          filteredHackathons={filteredHackathons}
          setFilteredHackathons={setFilteredHackathons}
        />
      </div>
      <Chatbot/>
    </GradientBackground>
  );
};

export default HackathonPage;
