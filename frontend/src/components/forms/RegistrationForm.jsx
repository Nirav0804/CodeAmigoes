import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import CookieConsent from "../CookieConsent"; 

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RegistrationForm = () => {
  const { username, userId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Cookie consent state
  const [cookieConsentGiven, setCookieConsentGiven] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const [user, setUser] = useState({
    username: '',
    id: ''
  });

  // Check cookie consent on component mount
  useEffect(() => {
    const checkCookieConsent = () => {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent || consent === 'undecided') {
        setShowCookieConsent(true);
        setCookieConsentGiven(false);
      } else if (consent === 'accepted') {
        setCookieConsentGiven(true);
        setShowCookieConsent(false);
      } else {
        // If declined, you might want to redirect or show limited functionality
        setCookieConsentGiven(false);
        setShowCookieConsent(false);
        // Optionally redirect to a page explaining cookie requirement
        // navigate('/cookie-required');
      }
    };

    checkCookieConsent();
  }, [navigate]);

  useEffect(() => {
    const username = searchParams.get("username");
    const id = searchParams.get("id");

    setUser({ username });

    setFormData((prev) => ({
      ...prev,
      githubUsername: username || "",
      username: username || "",
      displayName: username || "",
      id: id || ""
    }));
  }, [searchParams]);

  // Form state
  const [formData, setFormData] = useState({
    id: user.id,
    username: user.username,
    displayName: user.username,
    password: "",
    email: "",
    collegeName: "",
    githubUsername: user.username,
    leetcodeUsername: "",
    codechefUsername: "",
    hackerrankUsername: "",
    codeforcesUsername: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cookie consent handlers
  const handleCookieAccept = () => {
    setCookieConsentGiven(true);
    setShowCookieConsent(false);
  };

  const handleCookieDecline = () => {
    setCookieConsentGiven(false);
    setShowCookieConsent(false);
    // You can implement additional logic here, such as:
    // - Redirecting to a limited version of the site
    // - Showing a message about reduced functionality
    alert("Some features may be limited without cookie consent. You can change this in your browser settings.");
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if cookies are accepted before allowing registration
    if (!cookieConsentGiven) {
      setError("Please accept cookies to proceed with registration.");
      setShowCookieConsent(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build registration payload without public key
      const registrationData = { ...formData };

      // Call backend
      const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(registrationData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data==='string'?data:JSON.stringify(data));
      }

      // Mark success
      setSuccess(true);

      // Navigate on success
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-y-auto relative">
      {/* Cookie Consent Modal */}
      {showCookieConsent && (
        <CookieConsent 
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
        />
      )}

      {/* Overlay to block interaction when cookie consent is not given */}
      {!cookieConsentGiven && !showCookieConsent && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 text-center max-w-md mx-4">
            <h3 className="text-white text-xl font-bold mb-4">Cookie Consent Required</h3>
            <p className="text-gray-300 mb-4">
              Please accept our cookie policy to access the registration form.
            </p>
            <button
              onClick={() => setShowCookieConsent(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Review Cookie Policy
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Only accessible after cookie consent */}
      <div className={`${!cookieConsentGiven ? 'pointer-events-none opacity-50' : ''} transition-all duration-300`}>
        {/* Close button */}
        <Link to="/">
          <button className="fixed top-4 right-4 z-50 bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-700 transition-colors text-xl">
            ✕
          </button>
        </Link>

        {/* Main content */}
        <div className="container mx-auto px-10 py-20">
          <motion.div
            className="relative z-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl p-10 w-full max-w-3xl mx-auto backdrop-filter backdrop-blur-lg bg-opacity-50 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <h1 className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-8">
              <Typewriter
                words={["Welcome to CodeAmigos"]}
                loop={1}
                cursor
                cursorStyle="|"
                typeSpeed={100}
                deleteSpeed={50}
                delaySpeed={500}
              />
            </h1>

            {success && (
              <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-400 text-center">
                Registration successful! Welcome to CodeAmigos!
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-center">
                {error}
              </div>
            )}

            <p className="text-center text-gray-400 mb-8">
              Let's set up your account and start your journey!
            </p>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-8"
            >
              {[
                {
                  label: "Password",
                  name: "password",
                  type: "password",
                  placeholder: "Enter a strong password",
                  required: true,
                },
                {
                  label: "GitHub Username",
                  name: "githubUsername",
                  type: "text",
                  placeholder: "e.g., ompatel22",
                  readOnly: true,
                },
                {
                  label: "LeetCode Username",
                  name: "leetcodeUsername",
                  type: "text",
                  placeholder: "e.g., khushi703",
                  required: true,
                },
                {
                  label: "CodeChef Username",
                  name: "codechefUsername",
                  type: "text",
                  placeholder: "e.g., nirav0804",
                  required: true,
                },
                {
                  label: "GitHub email",
                  name: "email",
                  type: "email",
                  placeholder: "e.g., nayanthacker28@gmail.com",
                },
              ].map((field) => (
                <div
                  key={field.name}
                  className={`${field.label === "GitHub email" ? "sm:col-span-2" : "col-span-1"
                    } hover:scale-105 transition-transform transform`}
                >
                  <label className="block text-lg font-medium text-gray-300 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    readOnly={field.readOnly || false}
                    required={field.required}
                    className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 border border-gray-600 focus:ring-4 focus:ring-blue-500 focus:outline-none transition-all ${field.readOnly ? "cursor-not-allowed bg-gray-600" : ""
                      }`}
                  />
                </div>
              ))}
              <div className="col-span-1 sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading || !cookieConsentGiven}
                  className={`w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-transform transform ${loading || !cookieConsentGiven ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Scrolling Text */}
        <div className="fixed w-full bottom-10 overflow-hidden pointer-events-none">
          <motion.div
            className="whitespace-nowrap text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          >
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;