import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CookieConsent = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup if not already accepted
    const consentGiven = localStorage.getItem('cookie_consent');
    if (!consentGiven || consentGiven !== 'accepted') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        
        {/* Modal */}
        <motion.div
          className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg mx-4 border border-gray-700"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Cookie Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-2xl">🍪</span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              We Value Your Privacy
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We use cookies to enhance your browsing experience, provide personalized content, 
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
              You must accept cookies to continue using this site.
            </p>

            {/* Accept Button Only */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Accept All Cookies
              </button>
            </div>

            {/* Privacy Policy Link */}
            <p className="mt-4 text-xs text-gray-500">
              For more information, read our{" "}
              <a 
                href="/privacy-policy" 
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CookieConsent;
