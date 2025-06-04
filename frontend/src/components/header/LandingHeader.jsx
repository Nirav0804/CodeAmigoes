import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";


const LandingHeader = () => {
  const handleGithubLogin = () => {
    // ## Change the backend url here 
      window.location.href = "https://api.codeamigos.tech/oauth2/authorization/github";
  };

  return (
    <>
      <header id="about" className="relative min-h-screen overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 pt-8">
          <motion.div
            className="flex justify-between items-center w-full mb-16 px-2 sm:px-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="
                text-2xl sm:text-4xl font-bold
                text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400
              "
              whileHover={{ scale: 1.05 }}
            >
              CodeAmigos
            </motion.div>
            <div className="flex flex-col items-end">
              <motion.button
                onClick={handleGithubLogin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  bg-gradient-to-r from-blue-800 to-purple-800
                  text-white font-semibold py-2 px-4 sm:py-2.5 sm:px-6
                  rounded-lg shadow-lg hover:shadow-xl transition-all
                  text-sm sm:text-base
                  z-20 relative
                "
              >
                GitHub Login
              </motion.button>
            </div>
          </motion.div>

          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center -translate-y-6">
            {/* Logo */}
            <motion.img
              src="/logoN.png"
              alt="CodeAmigos Logo"
              className="mb-12 w-48 h-48 sm:w-60 sm:h-60"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <motion.h1
              className="text-5xl sm:text-7xl font-extrabold mb-6 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Connect, Collaborate, Conquer
              </span>
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl mb-10 max-w-2xl text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Showcase your GitHub, LeetCode, and CodeChef profiles, build your dream team with matching tech stacks, and chat securely. Upgrade to premium for personalized hackathon recommendations by skill and city with CodeAmigos.
            </motion.p>
          </div>
        </div>
      </header>
    </>
  );
};

export default LandingHeader;
