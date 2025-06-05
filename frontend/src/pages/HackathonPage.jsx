import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GradientBackground from "../components/background/GradientBackground";
import Navigation from "../components/navigation/Navigation";
import Navbar from "../components/navigation/NavBar";
import VerticalNavBar from "../components/navigation/VerticalNavBar";
import Chatbot from "../components/chatbot/Chatbot";

const HackathonPage = () => {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem("latitude", latitude);
        localStorage.setItem("longitude", longitude);
      },
      (error) => {
        console.error("Error getting location:", error.message);
      },
      {
        enableHighAccuracy: true,   // Ask for GPS/Wi-Fi scan if possible
        timeout: 10000,             // Give it up to 10 seconds to find a fix
        maximumAge: 0               // Don’t use a cached location
      }
    );
    }
  }, []);

  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-2 sm:px-4 pt-24 pb-24">
        {/* Responsive top navbar */}
        <Navbar
          hackathons={hackathons}
          setFilteredHackathons={setFilteredHackathons}
        />
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          {/* Responsive vertical nav */}
          <VerticalNavBar
            setHackathons={setHackathons}
            filteredHackathons={filteredHackathons}
            setFilteredHackathons={setFilteredHackathons}
          />
        </div>
      </div>
      <Chatbot />
    </GradientBackground>
  );
};

export default HackathonPage;
