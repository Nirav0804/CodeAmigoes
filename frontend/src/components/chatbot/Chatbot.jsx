import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Utility to clean unwanted starter phrases from messages
function cleanMessage(text) {
  if (!text) return "";
  return text.replace(/^(Type something\.{0,3}|Start typing\.{0,3}|Start type of something\.{0,3})/i, '').trim();
}

// Utility to format message with clickable links and preserve line breaks
function formatMessageWithLinks(text) {
  if (!text) return "";
  // Convert line breaks to <br> tags
  const withBreaks = text.replace(/\n/g, '<br>');
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,!?])/g;
  // Replace URLs with clickable links
  return withBreaks.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline text-blue-800 hover:text-blue-500">${url}</a>`);
}

const gradientHeader = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400";

// Floating open button
function ChatbotOpenButton({ onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, boxShadow: "0 0 0 8px rgba(124,58,237,0.15)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-label="Open chatbot"
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-all border-none outline-none focus:outline-none"
      style={{
        background: "radial-gradient(circle at 70% 30%, #60a5fa 0%,rgb(128, 103, 206) 60%, #34d399 100%)",
        boxShadow: "0 4px 24px 0 rgba(80, 70, 229, 0.25)",
        border: "none",
      }}
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
        }}
        className="block"
      >
        <svg width="34" height="34" viewBox="0 0 38 38" fill="none">
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
      </motion.span>
    </motion.button>
  );
}

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! How can I help you today? I'm here to assist you specifically with anything related to hackathons—feel free to ask, I can guide you thoroughly!" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isBotTyping]);

  const chatbotVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const typingVariants = {
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;
    const userMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsBotTyping(true);

    // Session logic
    const generateSessionId = () => {
      const sessionId = `session-${Date.now()}-${Math.random()}`;
      localStorage.setItem("session_id", sessionId);
      return sessionId;
    };
    const getSessionId = () => {
      return localStorage.getItem("session_id") || generateSessionId();
    };
    try {
      const payload = {
        session_id: getSessionId(),
        query: userInput,
        user_id: "default_user"
      };
      // Replace with your API endpoint
      const response = await fetch("https://api.codeamigos.tech/api/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
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
    } finally {
      setIsBotTyping(false);
    }
  };

  // Responsive width/height for mobile and desktop
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <ChatbotOpenButton onClick={() => setIsOpen(true)} />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chatbotVariants}
          className="w-[95vw] max-w-[380px] h-[70vh] sm:w-[350px] sm:max-w-[380px] sm:h-[500px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex justify-between items-center bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="flex items-center gap-2">
              <motion.img
                src='/logoN.png'
                alt="logo"
                className="w-8 h-12"
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
          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl max-w-[85%] relative shadow-md ${
                  msg.sender === "user"
                    ? "bg-gray-700/80 text-white self-end ml-auto backdrop-blur-sm"
                    : "bg-gradient-to-br from-purple-300/90 via-purple-300/90 to-fuchsia-300/90 text-gray-900 self-start"
                }`}
              >
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatMessageWithLinks(cleanMessage(msg.text)) }}
                />
              </motion.div>
            ))}
            {isBotTyping && (
              <motion.div
                variants={typingVariants}
                animate="animate"
                className="p-3 rounded-2xl max-w-[85%] bg-gradient-to-br from-purple-200/90 via-purple-300/90 to-fuchsia-200/90 text-gray-900 self-start flex items-center gap-2"
              >
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="inline-block w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                <span>Typing...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
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
