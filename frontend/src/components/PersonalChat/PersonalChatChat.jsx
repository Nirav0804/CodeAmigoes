import React, { useState, useEffect, useRef } from "react";
import { MdAttachFile, MdSend, MdEmojiEmotions } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import SockJS from "sockjs-client/dist/sockjs";
import { Stomp } from "@stomp/stompjs";
import { baseURL } from "../../config/AxiosHelper";
import { timeAgo } from "../../config/helper";
import { toast } from "react-toastify";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../context/AuthContext";
import { getChatKeyFromIdb } from "../../config/IndexDb";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// AES helpers
const importAESKey = async (base64Key) => {
  const rawKey = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "raw",
    rawKey.buffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

const encryptAES = async (message, base64Key) => {
  const key = await importAESKey(base64Key);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...combined));
};

const decryptAES = async (encryptedBase64, base64Key) => {
  const key = await importAESKey(base64Key);
  const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
};

const PersonalChatChat = ({ memberId, memberName, isKeySetupComplete, onBackClick, isMobile }) => {
  const { username, userId } = useAuth();
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [member2Id, setMember2Id] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const stompClientRef = useRef(null);
  const messageInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUser(username);
    setCurrentUserId(userId);
    setMember2Id(memberId);
  }, [memberId, username, userId]);

  useEffect(() => {
    if (currentUserId && member2Id && memberName && isKeySetupComplete) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [currentUserId, member2Id, memberName, isKeySetupComplete]);

  useEffect(() => {
    if (isReady && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isReady]);

  useEffect(() => {
    if (!member2Id) navigate("/dashboard/chat");
  }, [member2Id, navigate]);

  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;
    const sortedChatId = [currentUserId, member2Id].sort().join("/");

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const secretKey = await getChatKeyFromIdb(username , memberName);
        if (!secretKey) throw new Error("Secret key missing");

        const { data } = await axios.get(
          `${API_BASE}/api/v1/personal_chat/all_messages/${sortedChatId}`,
          { withCredentials: true }
        );

        if (Array.isArray(data)) {
          const decrypted = await Promise.all(
            data.map(async (msg) => {
              if (typeof msg.content !== 'string') return { ...msg, content: '[Invalid]' };
              try {
                const text = await decryptAES(msg.content, secretKey);
                return { ...msg, content: text };
              } catch {
                return { ...msg, content: '[Decryption Failed]' };
              }
            })
          );
          isMounted && setMessages(decrypted);
        } else {
          isMounted && setMessages([]);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
        isMounted && setMessages([]);
        toast.error('Failed to load messages');
      } finally {
        isMounted && setLoading(false);
      }
    };

    fetchMessages();
    return () => { isMounted = false; };
  }, [isReady, currentUserId, member2Id, memberName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUserId || !member2Id) return;
    let isMounted = true;
    const sortedChatId = [currentUserId, member2Id].sort().join("/");
    const socket = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(() => socket, {
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.connect({}, () => {
      stompClientRef.current = client;
      client.subscribe(
        `/api/v1/topic/personal_chat/${sortedChatId}`,
        async (frame) => {
          if (!isMounted) return;
          const newMsg = JSON.parse(frame.body);
          try {
            const key = await getChatKeyFromIdb(username,memberName);
            newMsg.content = await decryptAES(newMsg.content, key);
          } catch {
            newMsg.content = '[Decryption Failed]';
          }
          setMessages((prev) => [...prev, newMsg]);
        }
      );
    }, (error) => {
      console.error("WebSocket connection error:", error);
    });

    return () => {
      isMounted = false;
      stompClientRef.current?.disconnect();
      stompClientRef.current = null;
    };
  }, [currentUserId, member2Id, memberName]);

  const sendMessage = async () => {
    if (!stompClientRef.current || !input.trim()) return;
    try {
      const key = await getChatKeyFromIdb(username,memberName);
      if (!key) throw new Error('Secret key missing');
      const encrypted = await encryptAES(input, key);
      const msg = { sender: currentUser, content: encrypted, timestamp: new Date().toISOString() };
      const sortedChatId = [currentUserId, member2Id].sort().join("/");
      stompClientRef.current.send(
        `/app/personal_chat/send_message/${sortedChatId}`,
        {},
        JSON.stringify(msg)
      );
      setInput('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Send message error:", err);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-full bg-slate-600">
      {/* Header - WhatsApp style with back button on mobile */}
      <header className="sticky top-0 z-10 bg-gray-900 px-3 sm:px-4 py-3 shadow-md flex items-center gap-3">
        {/* Back button for mobile */}
        {isMobile && onBackClick && (
          <button
            onClick={onBackClick}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Back to chats"
          >
            <FaArrowLeft className="text-white text-lg" />
          </button>
        )}
        
        {/* Profile link and name */}
        <Link 
          to={`/dashboard/profile/${memberName}`}
          className="flex items-center gap-3 flex-1 hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
        >
          <img
            src={`https://github.com/${memberName}.png`}
            alt={memberName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">{memberName}</h1>
            <p className="text-xs text-gray-400">Tap to view profile</p>
          </div>
        </Link>
      </header>

      {/* Messages container */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 bg-slate-600"
        style={{ scrollBehavior: 'smooth' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-300 text-base sm:text-lg mb-2">No messages yet</p>
              <p className="text-gray-400 text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex mb-3 ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[90%] sm:max-w-[75%] md:max-w-[65%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl
                  ${msg.sender === currentUser
                    ? 'bg-green-600 text-white rounded-br-md ml-auto'
                    : 'bg-gray-700 text-gray-100 rounded-bl-md mr-auto'}
                  shadow-md break-words
                `}>
                  {/* Sender info - only show for received messages */}
                  {msg.sender !== currentUser && (
                    <div className="flex items-center mb-1">
                      <Link to={`/dashboard/profile/${msg.sender}`}>
                        <img
                          className="h-6 w-6 sm:h-7 sm:w-7 rounded-full mr-2"
                          src={`https://github.com/${msg.sender}.png`}
                          alt={`${msg.sender}`}
                        />
                      </Link>
                      <span className="font-semibold text-xs sm:text-sm text-blue-300">{msg.sender}</span>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  
                  {/* Timestamp */}
                  {/* <p className={`mt-1 text-[10px] sm:text-xs opacity-75 ${
                    msg.sender === currentUser ? 'text-right text-green-100' : 'text-left text-gray-300'
                  }`}>
                    {timeAgo(msg.timestamp)}
                  </p> */}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input area - WhatsApp style */}
      <div className="sticky bottom-0 bg-gray-900 px-2 sm:px-4 py-2 sm:py-3">
        <div className="relative max-w-4xl mx-auto">
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 right-0 z-30 flex justify-center">
              <div className="w-80 sm:w-96">
                <EmojiPicker
                  theme="dark"
                  onEmojiClick={(emojiObject) => setInput(prev => prev + emojiObject.emoji)}
                  searchDisabled={isMobile}
                  skinTonesDisabled={isMobile}
                  height={isMobile ? 350 : 400}
                />
              </div>
            </div>
          )}
          
          {/* Input row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="p-2 sm:p-2.5 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex-shrink-0"
              aria-label="Open emoji picker"
            >
              <MdEmojiEmotions size={isMobile ? 20 : 22} className="text-gray-900" />
            </button>

            {/* Message input */}
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-full bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base placeholder-gray-400"
                type="text"
                value={input}
                placeholder="Type a message..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                maxLength={1000}
              />
            </div>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`p-2 sm:p-2.5 rounded-full flex-shrink-0 transition-colors ${
                input.trim() 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <MdSend size={isMobile ? 18 : 20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { encryptAES, decryptAES };
export default PersonalChatChat;
