import React, { useState } from "react";
import HackathonList from "../hackathon/HackathonList";
import { useAuth } from "../../context/AuthContext";
import {
  FaClock,
  FaRunning,
  FaHistory,
  FaMapMarkerAlt,
  FaThumbsUp,
} from "react-icons/fa";

const VerticalNavBar = ({
  setHackathons,
  setFilteredHackathons,
  filteredHackathons,
}) => {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");

  const tabs = [
    {
      key: "upcoming",
      label: "Upcoming Hackathons",
      icon: <FaClock />,
      joinable: true,
      locked: false,
    },
    {
      key: "ongoing",
      label: "Ongoing Hackathons",
      icon: <FaRunning />,
      joinable: true,
      locked: false,
    },
    {
      key: "past",
      label: "Past Hackathons",
      icon: <FaHistory />,
      joinable: false,
      locked: false,
    },
    {
      key: "nearby",
      label: "Nearby Hackathons",
      icon: <FaMapMarkerAlt />,
      joinable: true,
      locked: status !== "paid",
    },
    {
      key: "recommended",
      label: "Recommended",
      icon: <FaThumbsUp />,
      joinable: true,
      locked: status !== "paid",
    },
  ];

  const handleTabChange = (tabKey, isLocked) => {
    if (!isLocked) setActiveTab(tabKey);
  };

  return (
    <div className="flex flex-col md:flex-row w-full">
      {/* Sidebar */}
      <nav className="md:w-1/4 w-full bg-gray-900/80 backdrop-blur-lg text-white p-4 rounded-xl md:mr-6 mb-6 md:mb-0 shadow-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-6 border-b border-gray-600 pb-2">
          Hackathon Filters
        </h2>
        <div className="flex md:flex-col flex-wrap gap-2">
          {tabs.map(({ key, label, icon, locked }) => (
            <button
              key={key}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-md font-medium transition-all duration-300
                ${
                  activeTab === key
                    ? "bg-gray-800 border-l-4 border-blue-500"
                    : "hover:bg-gray-800"
                }
                ${locked ? "opacity-50 cursor-not-allowed" : ""}
              `}
              onClick={() => handleTabChange(key, locked)}
              disabled={locked}
            >
              <span className="text-lg">{icon}</span>
              <span className="truncate">{label}</span>
              {locked && <span className="ml-auto">🔒</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-2 sm:p-4">
          <HackathonList
            type={activeTab}
            setHackathons={setHackathons}
            filteredHackathons={filteredHackathons}
            setFilteredHackathons={setFilteredHackathons}
            joinable={tabs.find((t) => t.key === activeTab)?.joinable}
          />
        </div>
      </main>
    </div>
  );
};

export default VerticalNavBar;
