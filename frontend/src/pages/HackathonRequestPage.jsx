import React, { useState, useEffect } from "react";
import GradientBackground from "../components/background/GradientBackground";
import Navigation from "../components/navigation/Navigation";
import HackathonRequestCard from "../components/hackathonRequest/HackathonRequestCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/chatbot/Chatbot";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const HackathonRequestPage = () => {
  const navigate = useNavigate();
  const [hackathonRequests, setHackathonRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const { username } = useAuth();

  useEffect(() => {
    fetchHackathonRequests(username);
  }, [navigate]);

  const fetchHackathonRequests = async (username) => {
    try {
      const response = await axios.get(`${API_BASE}/requests/${username}`, {
        withCredentials: true,
      });
      setHackathonRequests(response.data.reverse());
    } catch (error) {
      console.error("Error fetching hackathon requests:", error);
    }
  };

  const filteredRequests = hackathonRequests.filter(
    (request) => request.status.toLowerCase() === activeTab
  );

  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <div className="flex flex-col md:flex-row min-h-screen p-4 pt-24 mx-auto max-w-7xl pb-0 overflow-y-auto">
        <nav className="w-full md:w-1/4 bg-gray-900/80 backdrop-blur-lg text-white shadow-lg p-4 flex flex-col space-y-4 rounded-lg mb-6 md:mb-0 md:mr-8">
          <h1 className="text-2xl font-semibold text-center mb-6">
            Requests Received
          </h1>
          {["pending", "accepted", "rejected"].map((tab) => (
            <button
              key={tab}
              className={`p-3 rounded-lg text-lg font-semibold text-center ${
                activeTab === tab ? "bg-gray-700" : "hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Requests
            </button>
          ))}
        </nav>

        <main className="flex-1 bg-transparent">
          <div className="container mx-auto p-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center text-xl font-semibold mt-4 text-white">
                
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div className="mb-4" key={request.id}>
                  <HackathonRequestCard {...request} />
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      <Chatbot />
    </GradientBackground>
  );
};

export default HackathonRequestPage;
