import React, { useState, useEffect, useRef } from "react";
import { MdAttachFile, MdSend, MdEmojiEmotions } from "react-icons/md";
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
import { getUserPrivateKey } from "../../config/fileFunctions";

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

const PersonalChatChat = ({ memberId, memberName, isKeySetupComplete }) => {
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
  const messageInputRef = useRef(null); // Ref for the message input field
  const navigate = useNavigate();

  // Initialize user and member IDs
  useEffect(() => {
    setCurrentUser(username);
    setCurrentUserId(userId);
    setMember2Id(memberId);
  }, [memberId, username, userId]);

  // Check if all required data is ready
  useEffect(() => {
    if (currentUserId && member2Id && memberName && isKeySetupComplete) {
      setIsReady(true);
    } else {
      setIsReady(false);
      console.log('Waiting for data:', { currentUserId, member2Id, memberName, isKeySetupComplete });
    }
  }, [currentUserId, member2Id, memberName, isKeySetupComplete]);

  // Focus the input field when the chat opens
  useEffect(() => {
    if (isReady && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isReady]);

  // Redirect if no chat target
  useEffect(() => {
    if (!member2Id) navigate("/dashboard/chat");
  }, [member2Id, navigate]);

  // Fetch and decrypt past messages when ready
  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;
    const sortedChatId = [currentUserId, member2Id].sort().join("/");
    console.log("Fetch messages called");

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const secretKey = await getChatKeyFromIdb(memberName);
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup WebSocket for live messages
  useEffect(() => {
    if (!currentUserId || !member2Id) return;
    let isMounted = true;
    const sortedChatId = [currentUserId, member2Id].sort().join("/");
    const socket = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(() => socket, {
      reconnectDelay: 5000, // Enable auto-reconnect with 5-second delay
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
            const key = await getChatKeyFromIdb(memberName);
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

  // Send a message
  const sendMessage = async () => {
    if (!stompClientRef.current || !input.trim()) return;
    try {
      const key = await getChatKeyFromIdb(memberName);
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
    } catch (err) {
      console.error("Send message error:", err);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900 py-4 shadow">
        <Link to={`/dashboard/profile/${memberName}`}>
          <h1 className="text-center text-2xl font-bold text-blue-400">{memberName}</h1>
        </Link>
      </header>

      {/* Messages container */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-auto p-4 bg-slate-600"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-300">No messages yet</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex mb-3 ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-4 rounded-2xl ${msg.sender === currentUser ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-100'}`}>
                <div className="flex items-center mb-2">
                  <Link to={`/dashboard/profile/${msg.sender}`}>
                    <img
                      className="h-8 w-8 rounded-full mr-2"
                      src={`https://github.com/${msg.sender}.png`}
                      alt={`${msg.sender}`}
                    />
                  </Link>
                  <span className="font-semibold">{msg.sender}</span>
                </div>
                <p className="break-words whitespace-pre-wrap text-left">{msg.content}</p>
                <p className="mt-2 text-xs text-gray-400 text-right">
                  {timeAgo(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <div className="sticky bottom-0 bg-gray-900 p-4">
        <div className="relative max-w-2xl mx-auto flex items-center space-x-3">
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="p-2 rounded-full bg-yellow-500"
          >
            <MdEmojiEmotions size={24} />
          </button>
          <input
            ref={messageInputRef} // Attach the ref to the input
            className="flex-1 px-4 py-2 rounded-full bg-gray-800 text-white outline-none"
            type="text"
            value={input}
            placeholder="Type a message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="p-2 rounded-full bg-green-600"
          >
            <MdSend size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-20">
              <EmojiPicker
                theme="dark"
                onEmojiClick={(emojiObject) => setInput(i => i + emojiObject.emoji)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { encryptAES, decryptAES };
export default PersonalChatChat;