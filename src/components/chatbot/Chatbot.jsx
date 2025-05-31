import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Utility to clean unwanted starter phrases from messages
function cleanMessage(text) {
  if (!text) return "";
  return text.replace(/^(Type something\.{0,3}|Start typing\.{0,3}|Start type of something\.{0,3})/i, '').trim();
}

const gradientHeader = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400";

// Custom open button inspired by your image
function ChatbotOpenButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, boxShadow: "0 0 0 8px rgba(124,58,237,0.15)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-label="Open chatbot"
      className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all border-none outline-none focus:outline-none"
      style={{
        background: "radial-gradient(circle at 70% 30%, #60a5fa 0%, #a78bfa 60%, #34d399 100%)",
        boxShadow: "0 4px 24px 0 rgba(80, 70, 229, 0.25)",
        border: "none",
      }}
    >
      {/* Centered bot/plug icon (SVG) */}
      <span className="block">
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="16" fill="#181C2F" />
          <rect x="12" y="13" width="14" height="12" rx="6" fill="url(#botGradient)" />
          <rect x="15" y="17" width="2" height="4" rx="1" fill="#fff" opacity="0.85" />
          <rect x="21" y="17" width="2" height="4" rx="1" fill="#fff" opacity="0.85" />
          <defs>
            <linearGradient id="botGradient" x1="12" y1="13" x2="26" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a78bfa" />
              <stop offset="1" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    </motion.button>
  );
}

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! How can I help you today?" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const chatbotVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsBotTyping(true);

    try {
      const payload = {
        session_id: "user124-session",
        query: userInput,
        user_id: "default_user"
      };
      
      const response = await fetch("http://localhost:8080/api/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      
      const text = await response.text();
      let botReplyText;
      try {
        botReplyText = JSON.parse(text)?.response || "Sorry, I couldn't understand.";
      } catch {
        botReplyText = text || "Sorry, I couldn't understand.";
      }
      
      setMessages((prev) => [...prev, { sender: "bot", text: botReplyText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong. Please try again." }
      ]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <ChatbotOpenButton onClick={() => setIsOpen(true)} />
      ) : (
     <motion.div
  initial="hidden"
  animate="visible"
  variants={chatbotVariants}
  className="w-[350px] max-h-[500px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-2xl flex flex-col"
  // Remove the style prop if you don't want any border
>

          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-2">
              <motion.img
                src="src/logoN.png"  // Replace with your actual logo path
                alt="logot"
                className="w-8 h-10"
              />
              <span className={`text-xl font-bold ${gradientHeader}`}>CodeAmigos AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close chatbot"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl max-w-[85%] relative shadow-md ${
                  msg.sender === "user"
                    // Muted dark gray with glass effect for user message
                    ? "bg-gray-700/80 text-white self-end ml-auto backdrop-blur-sm"
                    // Lighter, beautiful bot response
                    : "bg-gradient-to-br from-purple-200/90 via-purple-300/90 to-fuchsia-200/90 text-gray-900 self-start"
                }`}
              >
                {cleanMessage(msg.text)}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-700/50 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-900/80 text-white border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-400 backdrop-blur-sm"
                placeholder="Message..."
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md hover:from-purple-600 hover:to-purple-800 transition-all"
                aria-label="Send"
              >
                {/* Heroicons Paper Airplane (Arrow) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;
