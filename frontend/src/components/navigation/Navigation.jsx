import { Link, useNavigate, NavLink } from "react-router-dom";
import React, { useState } from "react";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaUsers,
  FaCode,
} from "react-icons/fa";
import Username from "./Username";
import NavItem from "./NavItem";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Navigation = () => {
  const { username, status } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("session_id");
      await fetch(`${API_BASE}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    navigate("/");
  };

  const handleRedirect = () => {
    navigate(`/dashboard`);
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-lg text-white shadow-lg fixed w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/logoN.png"
              alt="logo"
              className="w-8 h-10 sm:w-12 sm:h-16"
            />
            <Link
              onClick={handleRedirect}
              className="text-2xl sm:text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
            >
              CodeAmigos
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {status === "paid" ? (
              <span className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-700 text-sm sm:text-base text-white font-semibold rounded-lg shadow-md animate-pulse">
                Premium 💎
              </span>
            ) : (
              <button
                onClick={() => {
                  navigate("/subscription");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm sm:text-base text-white transition duration-300"
              >
                Subscribe
              </button>
            )}

            <NavLink
              to="/dashboard/chat"
              className={({ isActive }) =>
                `flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-sm sm:text-base
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <FaUsers className="mr-2" />
              Chat
            </NavLink>

            <NavLink
              to="/dashboard/hackathons"
              className={({ isActive }) =>
                `flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-sm sm:text-base
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <FaCode className="mr-2" />
              Hackathons
            </NavLink>

            <NavLink
              to={`/dashboard/profile/${username}`}
              className={({ isActive }) =>
                `flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-sm sm:text-base
                ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <FaUser className="mr-2" />
              <Username username={username} />
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm sm:text-base text-white transition duration-300"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white focus:outline-none p-2"
          >
            <FaBars size={24} />
          </button>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden fixed top-0 left-0 w-3/4 h-full bg-gray-900 p-4 shadow-lg z-50 transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <img src="/logoN.png" alt="logo" className="w-8 h-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodeAmigos
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-white p-2 hover:bg-gray-700 rounded-lg"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Wrapped Mobile Items in a Background Card */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          {/* Subscription Status */}
          {status === "paid" ? (
            <div className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-center animate-pulse">
              Premium Member 💎
            </div>
          ) : (
            <button
              onClick={() => {
                navigate("/subscription");
                setMenuOpen(false);
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition duration-300 flex items-center justify-center gap-2"
            >
              Subscribe
            </button>
          )}

          <NavItem
            to="/dashboard/chat"
            icon={<FaUsers />}
            onClick={() => setMenuOpen(false)}
          >
            Personal Chat
          </NavItem>

          <NavItem
            to="/dashboard/hackathons"
            icon={<FaCode />}
            onClick={() => setMenuOpen(false)}
          >
            Hackathons
          </NavItem>

          <NavItem
            to={`/dashboard/profile/${username}`}
            icon={<FaUser />}
            onClick={() => setMenuOpen(false)}
          >
            <Username username={username} />
          </NavItem>

          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition duration-300 flex items-center justify-center gap-2"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
