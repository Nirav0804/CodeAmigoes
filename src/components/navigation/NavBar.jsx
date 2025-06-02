import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { debounce } from "lodash";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

const Navbar = ({ hackathons, setFilteredHackathons }) => {
  const [titleSearch, setTitleSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const debouncedSearch = useCallback(
    debounce((titleQuery, cityQuery) => {
      const filtered = hackathons.filter((hackathon) => {
        const matchesTitle = hackathon.title
          .toLowerCase()
          .includes(titleQuery.toLowerCase());
        const matchesCity = hackathon.location
          .toLowerCase()
          .includes(cityQuery.toLowerCase());
        return matchesTitle && matchesCity;
      });

      setFilteredHackathons(filtered);
    }, 300),
    [hackathons]
  );

  const handleTitleSearchChange = (e) => {
    const query = e.target.value;
    setTitleSearch(query);
    debouncedSearch(query, citySearch);
  };

  const handleCitySearchChange = (e) => {
    const query = e.target.value;
    setCitySearch(query);
    debouncedSearch(titleSearch, query);
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-lg rounded-lg p-4 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Search Fields */}
      <div className="flex flex-col sm:flex-row w-full md:w-2/3 gap-2 sm:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Title..."
            value={titleSearch}
            onChange={handleTitleSearchChange}
            className="w-full pl-10 pr-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by City..."
            value={citySearch}
            onChange={handleCitySearchChange}
            className="w-full pl-10 pr-3 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
        <Link to="/dashboard/hackathons/add" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Add Hackathon
          </button>
        </Link>
        <Link to="/dashboard/hackathons/requests" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Requests Received
          </button>
        </Link>
        <Link to="/dashboard/hackathons/requests/status" className="w-full sm:w-auto">
          <button className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Your Requests' Status
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
