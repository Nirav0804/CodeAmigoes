import React, { useState, useEffect } from "react";
import { Calendar, Users, MapPin, Monitor, Globe } from "lucide-react";
import GradientBackground from "../components/background/GradientBackground";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "../components/navigation/Navigation";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import Chatbot from "../components/chatbot/Chatbot";
import { isFileSystemSupported, isMobileDevice } from "../config/fileFunctions";
import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationCircle, FaTimes } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const HackathonDetailsPage = () => {
  const navigate = useNavigate();
  const { username, userId } = useAuth();
  const { id } = useParams();
  const [hackathonData, setHackathonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestObject, setRequestObject] = useState({});
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorType, setErrorType] = useState(null);

  const fetchHackathonData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/hackathons/${id}`,
        { withCredentials: true }
      );
      setHackathonData(response.data);
      setRequestObject({
        hackathonId: response.data.id,
        hackathonTitle: response.data.title,
        createdBy: response.data.createdBy,
        requestedBy: username,
        status: "pending",
      });
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      navigate("/dashboard");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      navigate("/dashboard/hackathons");
      return;
    } else {
      fetchHackathonData();
    }
    // eslint-disable-next-line
  }, [id, username]);

  useEffect(() => {
    if (text === "send") {
      handleJoin();
    }
    if (success === true) {
      if (new Date(hackathonData?.registrationDates.end) < new Date()) {
        setVisible(false);
      }
    }
    if (success === true && hackathonData?.requestsToJoin.includes(username)) {
      setVisible(false);
    }
    if (requestObject.createdBy === username) {
      setVisible(false);
    }
    if (success === true && hackathonData?.teamSize.max === hackathonData?.currentTeamSize) {
      setVisible(false);
    }
    // eslint-disable-next-line
  }, [text, success]);

  const handleChatNow = async () => {
    try {
      if (isMobileDevice() || !isFileSystemSupported()) {
        setErrorType(isMobileDevice() ? "mobile" : "filesystem");
        return;
      }
      const member2Id = hackathonData.createdById;
      const leader = hackathonData.createdBy;
      await axios.post(
        `${API_BASE}/api/v1/personal_chat/create_or_get_personal_chat/${userId}/${member2Id}`,
        {},
        { withCredentials: true }
      );
      navigate('/dashboard/chat?leader=' + leader);
    } catch (error) {
      setErrorType("chat-error");
    }
  };

  const handleJoin = async () => {
    try {
      await axios.post(`${API_BASE}/request`, requestObject, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      toast.success("Request sent successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.message, {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  if (loading)
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center text-white">
          <div className="animate-pulse text-2xl">
            Loading Hackathon Details...
          </div>
        </div>
      </GradientBackground>
    );

  if (error)
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center text-red-400">
          <div className="text-2xl">Error: {error}</div>
        </div>
      </GradientBackground>
    );

  return (
    <GradientBackground>
      <ToastContainer />
      <Navigation />
      <div className="min-h-screen max-w-6xl mx-auto px-2 sm:px-4 md:px-6 py-8 flex flex-col gap-8 pt-16">
        {/* Responsive grid: sidebar below on mobile, right on desktop */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Details Section */}
          <div className="w-full lg:w-2/3 bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 mb-6 lg:mb-0">
            <div className="w-full aspect-video flex items-center justify-center overflow-hidden rounded-lg bg-gray-800 mb-6">
              <img
                src={hackathonData.logo}
                alt="Hackathon Visual"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <h3 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
              About the Hackathon
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {hackathonData.about}
            </p>
          </div>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 bg-gray-900/90 backdrop-blur-lg rounded-2xl text-white space-y-8 shadow-2xl border border-white/20 p-4 sm:p-8 self-start sticky top-8">
            {/* Hackathon Title & Organization */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                {hackathonData.title}
              </h2>
              <p className="text-gray-300 text-lg">{hackathonData.organization}</p>
            </div>

            <div className="flex items-center space-x-4">
              <Link to={`/dashboard/profile/${hackathonData.createdBy}`}>
                <img
                  src={`https://github.com/${hackathonData.createdBy}.png`}
                  alt="Uploaded by"
                  className="h-10 w-10 rounded-full border-2 border-white/30 hover:scale-105 transition-transform"
                />
              </Link>
              <div>
                <p className="font-semibold">Uploaded By</p>
                <p className="text-gray-300 capitalize">{hackathonData.createdBy}</p>
              </div>
              {username !== hackathonData.createdBy && (
                <button
                  className="ml-auto px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition duration-200 text-sm"
                  onClick={handleChatNow}
                >
                  Chat Now
                </button>
              )}
            </div>

            {/* Dates Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Calendar className="text-blue-400" size={20} />
                <div>
                  <p className="font-semibold">Registration Period</p>
                  <p className="text-gray-300">
                    {new Date(hackathonData.registrationDates.start).toLocaleDateString()} -{" "}
                    {new Date(hackathonData.registrationDates.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {hackathonData.hackathonDates && (
                <div className="flex items-center space-x-4">
                  <Calendar className="text-blue-400" size={20} />
                  <div>
                    <p className="font-semibold">Hackathon Dates</p>
                    <p className="text-gray-300">
                      {new Date(hackathonData.hackathonDates.start).toLocaleDateString()} -{" "}
                      {new Date(hackathonData.hackathonDates.end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Team Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Users className="text-purple-400" size={20} />
                <div>
                  <p className="font-semibold">Team Composition</p>
                  <p className="text-gray-300">
                    {`${hackathonData.teamSize.min}-${hackathonData.teamSize.max} members`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Users className="text-purple-400" size={20} />
                <div>
                  <p className="font-semibold">Current Team Size</p>
                  <p className="text-gray-300">
                    {hackathonData.currentTeamSize} members
                  </p>
                </div>
              </div>
            </div>

            {/* Mode & Location */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Monitor className="text-green-400" size={20} />
                <div>
                  <p className="font-semibold">Mode</p>
                  <p className="text-gray-300 capitalize">{hackathonData.mode}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Globe className="text-green-400" size={20} />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="text-gray-300 capitalize">
                    {hackathonData.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {hackathonData.acceptedUsers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-700 pb-2">
                  <Users className="text-purple-400" size={20} />
                  <p className="text-lg font-semibold">Team Members</p>
                </div>
                <div className="space-y-3">
                  {hackathonData.acceptedUsers.map((user) => (
                    <div className="flex items-center space-x-4" key={user}>
                      <Link to={`/dashboard/profile/${user}`}>
                        <img
                          src={`https://github.com/${user}.png`}
                          alt={`${user}'s profile`}
                          className="h-10 w-10 rounded-full border-2 border-white/30 hover:scale-105 transition-transform"
                        />
                      </Link>
                      <p className="text-gray-300 capitalize">{user}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visible && (
              <button
                onClick={() => {
                  setText("send");
                  setVisible(false);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded mt-8 w-full hover:bg-blue-600 transition-colors"
              >
                Join Now
              </button>
            )}
          </aside>
        </div>
      </div>
      <Chatbot />
      {/* Custom error toast for unsupported device/browser */}
      <AnimatePresence>
        {errorType && (
          <motion.div
            className="fixed bottom-6 right-6 max-w-xs w-full bg-red-600 text-white rounded-lg shadow-lg flex items-start p-4 space-x-3 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <FaExclamationCircle className="mt-1 text-xl text-white" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Unsupported Device or Browser</p>
              <p className="mt-1 text-xs leading-snug">
                Please use Chrome, Edge, or Opera on a Windows desktop to access chats.
              </p>
              {errorType === "mobile" && (
                <p className="mt-1 text-xs leading-snug">
                  If you’re using a browser with developer tools open, please close them and try again.
                </p>
              )}
              {errorType === "chat-error" && (
                <p className="mt-1 text-xs leading-snug">
                  Unable to create or fetch the personal chat. Please try again.
                </p>
              )}
            </div>
            <button
              onClick={() => setErrorType(null)}
              className="text-white hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GradientBackground>
  );
};

export default HackathonDetailsPage;
