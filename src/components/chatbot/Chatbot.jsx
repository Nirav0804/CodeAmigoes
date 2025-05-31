import React, { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi! How can I help you today?" }]);
  const [userInput, setUserInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Function to format text and make URLs clickable
  const formatMessage = (text) => {
    // Replace newlines with <br /> for proper formatting
    const formattedText = text.replace(/\n/g, "<br />");
    // Regular expression to detect URLs
    const urlRegex = /(https?:\/\/[^\s<]+)(?![^<]*>)/g;
    // Replace URLs with clickable anchor tags
    return formattedText.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline">${url}</a>`);
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
      console.log("Sending request to: http://localhost:8080/api/chatbot/test");
      console.log("Payload:", JSON.stringify(payload));
      const response = await fetch("http://localhost:8080/api/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response status:", response.status, "Status text:", response.statusText, "Body:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText || response.statusText}`);
      }

      const text = await response.text();
      console.log("Raw response:", text);

      let botReplyText;
      try {
        const data = JSON.parse(text);
        botReplyText = data.response || data.reply || data.message || data.answer || "Sorry, I couldn't understand.";
      } catch (e) {
        console.error("JSON parsing error:", e.message);
        botReplyText = text || "Sorry, I couldn't understand.";
      }

      const botReply = { sender: "bot", text: botReplyText };
      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error("❌ Fetch error:", error.message, "Details:", error);
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open chatbot"
        >
          💬
        </button>
      ) : (
        <div className="w-[350px] max-h-[500px] bg-[#1f1f1f] border border-gray-700 rounded-xl shadow-xl flex flex-col">
          <div className="p-4 border-b border-gray-700 text-white font-bold flex justify-between items-center">
            💬 Chatbot
            <button
              onClick={() => setIsOpen(false)} // Fixed typo: setIsOpen36 to setIsOpen
              className="text-gray-400 hover:text-white"
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white self-end ml-auto"
                    : "bg-gray-800 text-gray-200 self-start"
                }`}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
              />
            ))}
            {isBotTyping && (
              <div className="p-2 rounded-lg max-w-[80%] bg-gray-800 text-gray-200 self-start flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <span>Typing...</span>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-700 flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
              placeholder="Type your message..."
              disabled={isBotTyping}
            />
            <button
              onClick={handleSend}
              className={`px-4 py-2 text-white rounded-lg ${
                isBotTyping ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isBotTyping}
            >
              {isBotTyping ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;