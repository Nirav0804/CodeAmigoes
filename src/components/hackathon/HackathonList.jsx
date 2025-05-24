import React, { useState, useEffect } from "react";
import HackathonCard from "./HackathonCard";
import HackathonMap from "./HackathonMap";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const HackathonList = ({
  setHackathons,
  filteredHackathons,
  setFilteredHackathons,
  type,
  joinable,
}) => {
  const username = localStorage.getItem("username");
  const [latitude, setLatitude] = useState(localStorage.getItem("latitude"));
  const [longitude, setLongitude] = useState(localStorage.getItem("longitude"));
  const radius = 600
  const fetchHackathons = async () => {
    // if (type === "active") {
    //   const response = await fetch("https://codeamigos-backend.onrender.com/api/hackathons");
    //   const data = await response.json();
    //   setHackathons(data);
    //   setFilteredHackathons(data);
    // }
    if (type === "past") {
      const response = await fetch(`${API_BASE}/api/hackathons/past`);
      const data = await response.json();
      console.log(response);
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type === "ongoing") {
      const response = await fetch(
        `${API_BASE}/api/hackathons/ongoing`
      );
      const data = await response.json();
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type === "upcoming") {
      const response = await fetch(
        `${API_BASE}/api/hackathons/upcoming`
      );
      const data = await response.json();
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type == "nearby") {
      const response = await fetch(
        `${API_BASE}/api/hackathons/nearby-hackathons?latitude=${latitude}&longitude=${longitude}&radius=600`
      );
      const data = await response.json();
      setHackathons(data);
      setFilteredHackathons(data);
    }
    if (type == "recommended") {
      console.log("Hello");

      const response = await fetch(
        `${API_BASE}/api/hackathons/recommended-hackathons?username=${username}`
      );
      const data = await response.json();
      console.log(data);

      if (data.length == 0) {
        setHackathons(["No recommended Hacathons found"])
      } else {
        const hackathons = data.map(item => item.hackathon)
        setHackathons(hackathons);
        setFilteredHackathons(hackathons);
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
