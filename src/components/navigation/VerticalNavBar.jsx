import React, { useEffect, useState } from "react";
import HackathonList from "../hackathon/HackathonList";
import { useAuth } from "../../context/AuthContext";

const VerticalNavBar = ({
  setHackathons,
  setFilteredHackathons,
  filteredHackathons,
}) => {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  // const [status, setStatus] = useState("unpaid");

  // useEffect(() => {
  //   const localStatus = localStorage.getItem("status") || "unpaid";
  //   setStatus(localStatus);
  // }, []);

  const tabs = [
    { key: "upcoming", label: "Upcoming Hackathons", joinable: true, locked: false },
    { key: "ongoing", label: "Ongoing Hackathons", joinable: true, locked: false },
    { key: "past", label: "Past Hackathons", joinable: false, locked: false },
    { key: "nearby", label: "Nearby Hackathons", joinable: true, locked: status !== "paid" },
    { key: "recommended", label: "Recommended Hackathons", joinable: true, locked: status !== "paid" },
  ];

  const handleTabChange = (tabKey, isLocked) => {
    if (!isLocked) {
      setActiveTab(tabKey);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar Navigation */}
      <nav className="w-1/5 bg-gray-900/80 backdrop-blur-lg text-white shadow-lg p-4 flex flex-col space-y-4 rounded-lg mr-8 min-h-screen">
        <h2 className="text-xl font-semibold mb-6 text-center">Hackathon Filters</h2>
        {tabs.map(({ key, label, locked }) => (
          <button
            key={key}
            className={`p-3 rounded-lg text-left font-medium flex justify-between items-center transition ${activeTab === key ? "bg-gray-700" : "hover:bg-gray-800"
              } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleTabChange(key, locked)}
            disabled={locked}
          >
            <span>{label}</span>
            {locked && <span className="ml-2">🔒</span>}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main className="flex-1 bg-transparent overflow-y-auto">
        <div className="container mx-auto p-4 pt-4">
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
}
export default VerticalNavBar;