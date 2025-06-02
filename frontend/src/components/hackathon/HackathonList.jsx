import React, { useState, useEffect } from "react";
import HackathonCard from "./HackathonCard";
import HackathonMap from "./HackathonMap";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const HackathonList = ({
  setHackathons,
  filteredHackathons,
  setFilteredHackathons,
  type,
  joinable,
}) => {
  const navigate = useNavigate();
  const { username, status } = useAuth();
  const [latitude, setLatitude] = useState(localStorage.getItem("latitude"));
  const [longitude, setLongitude] = useState(localStorage.getItem("longitude"));
  const radius = 600
  const fetchHackathons = async () => {
    if (type === "past") {
      const response = await fetch(`${API_BASE}/api/hackathons/past`, {
        credentials: 'include',
      });

      const data = await response.json();
      // console.log(response);
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type === "ongoing") {
      const response = await fetch(
        `${API_BASE}/api/hackathons/ongoing`, {
        credentials: 'include',
      }
      );
      const data = await response.json();
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type === "upcoming") {
      const response = await fetch(
        `${API_BASE}/api/hackathons/upcoming`, {
        credentials: 'include',
      }
      );
      const data = await response.json();
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type == "nearby") {
      // console.log(`status : ${status}`);
      
      if (status !== "paid") {
        navigate("/dashboard");
      }
      else {
        const response = await fetch(
          `${API_BASE}/api/hackathons/nearby-hackathons?latitude=${latitude}&longitude=${longitude}&radius=600`, {
          credentials: 'include',
        }
        );
        const data = await response.json();
        setHackathons(data);
        setFilteredHackathons(data);
      }
    }
    if (type == "recommended") {
      if (status !== "paid") {
        navigate("/dashboard");
      }
      else {
        // console.log("Hello");

        const response = await fetch(
          `${API_BASE}/api/hackathons/recommended-hackathons?username=${username}`, {
          credentials: 'include',
        }
        );
        const data = await response.json();
        // console.log(data);

        if (data.length == 0) {
          setHackathons(["No recommended Hacathons found"])

        } else {
          const hackathons = data.map(item => item.hackathon)
          setHackathons(hackathons);
          setFilteredHackathons(hackathons);
        }
      }
    }
  };

  useEffect(() => {
    setFilteredHackathons([]);
    fetchHackathons();
  }, [type, latitude, longitude]);

  return (
    <>
      {
        type == "nearby" && <HackathonMap latitude={latitude} longitude={longitude} radius={radius} hackathons={filteredHackathons} />
      }
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
        {Array.isArray(filteredHackathons) &&
          filteredHackathons.map((hackathon, index) => (
            <HackathonCard key={index} {...hackathon} joinable={joinable} type={type} />
          ))}
      </div>
    </>
  );
};

export default HackathonList;
