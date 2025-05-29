import React from "react";
import FeatureCard from "./FeatureCard";
import { motion } from "framer-motion";

const FeatureSection = ({ text }) => {
  return (
    <div id="features" className="min-h-screen flex flex-col justify-center py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {text}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mt-8">
           Kick off your journey with CodeAmigos — join challenges, showcase your skills, and discover your ideal coding partner!
          </p>
        </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-0 gap-y-5">
          {[
            {
              icon: "👨‍💻",
              title: "Build Your Profile",
              description:
                "Showcase your achievements from GitHub, LeetCode, CodeChef — and highlight the powerful frameworks you've mastered!",
            },
            {
              icon: "🤝",
              title: "Hackathon Connections",
              description:
                "Discover hackathons tailored to your tech — team up with like-minded developers and build your dream team effortlessly.",
            },
            {
              icon: "💬",
              title: "One on One Chat",
              description:
                "Collaborate with peers through secure, end-to-end encrypted chats — build meaningful connections with confidence.",
            },
             {
              icon: "💎",
              title: "Premium Features",
              description:
                "Get hackathon recommendations tailored to your tech stack and location — build, compete, and shine where you belong!",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center h-full"
            >
              <FeatureCard
                icon={card.icon}
                title={card.title}
                description={card.description}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;
