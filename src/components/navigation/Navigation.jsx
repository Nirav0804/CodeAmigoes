import { Link, useNavigate, NavLink } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUsers, FaComments, FaCode } from "react-icons/fa";
import Username from "./Username";
import NavItem from "./NavItem";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const Navigation = () => {
  const { username, status } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // const username = localStorage.getItem("username");
  const [showPaymentSuccessCard, setShowPaymentSuccessCard] = useState(false);
  // const [status, setStatus] = useState("");
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/users/logout`, {
        method: 'POST',
        credentials: 'include', // Ensures cookies are sent!
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    // Clear localStorage
    // localStorage.removeItem("username");
    // localStorage.removeItem("userId");
    // localStorage.removeItem("college");
    // localStorage.removeItem("githubUsername");
    // localStorage.removeItem("status");
    // Redirect to homepage or login
    //  localStorage.removeItem("rsaPrivateKey");
    //  localStorage.removeItem("rsaPublicKey");
    navigate("/");
  };


  const handleRedirect = () => {
    // const status = localStorage.getItem("status");
    // const userId = localStorage.getItem("userId");
    // navigate(`/dashboard?username=${username}&status=${status}&userId=${userId}&githubUsername=${username}`);
    navigate(`/dashboard`);
  }

  // useEffect(() => {
  //   const s = localStorage.getItem("status");
  //   setStatus(s);
  // }, []);

  return (
    <nav className="bg-gray-900/80 backdrop-blur-lg text-white shadow-lg fixed w-full z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
      <Link
  onClick={() => handleRedirect()}
  className="flex items-center space-x-2 text-3xl font-extrabold tracking-wide text-blue-400"
>
  <motion.img
    src="/logoN.png"
    alt="logo"
    className="w-12 h-18"
  />
  <span>CodeAmigos</span>
</Link>

          <div className="hidden md:flex items-center space-x-8">
            {status === "paid" ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-lg shadow-md animate-pulse">
                Premium Member 💎
              </span>
            ) : (
              <button
                onClick={() => {
                  navigate("/subscription");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition duration-300 w-52"
              >
                Subscribe
              </button>
            )}
            <NavLink
              to="/dashboard/chat"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-all 
     ${isActive ? "bg-blue-600 text-white hover:bg-blue-" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`
              }
            >
              <FaUsers className="mr-2" />
              Personal Chat
            </NavLink>

            <NavLink
              to="/dashboard/hackathons"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-all 
     ${isActive ? "bg-blue-600 text-white hover:bg-blue-300" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`
              }
            >
              <FaCode className="mr-2" />
              Hackathons
            </NavLink>

            <NavLink
              to={`/dashboard/profile/${username}`}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-lg transition-all 
     ${isActive ? "bg-blue-600 text-white hover:bg-blue-300" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`
              }
            >
              <FaUser className="mr-2" />
              <Username username={username} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition duration-300"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white focus:outline-none">
            {menuOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden fixed top-0 left-0 w-2/3 h-full bg-gray-900 p-6 shadow-lg transform ${menuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
        <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-white">
          <FaTimes size={28} />
        </button>
        <div className="mt-10 space-y-6">
          <NavItem to="/dashboard/chat" icon={<FaUsers />} onClick={() => setMenuOpen(false)}>Personal Chat</NavItem>
          <NavItem to="/dashboard/hackathons" icon={<FaCode />} onClick={() => setMenuOpen(false)}>Hackathons</NavItem>
          <NavItem to={`/dashboard/profile/${username}`} icon={<FaUser />} onClick={() => setMenuOpen(false)}>
            <Username username={username} />
          </NavItem>
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition duration-300 w-full"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>
      {showPaymentSuccessCard && <PaymentSuccessCard />}
    </nav>
  );
};

export default Navigation;