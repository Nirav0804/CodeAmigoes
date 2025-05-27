import React, { useEffect, useRef, useState } from "react";
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
import { encryptMessage, decryptMessage } from "../../config/rascrypto"; // Import RSA methods
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PersonalChatChat = ({ memberId, memberName }) => {
  const { username, userId } = useAuth();
  const [connected, setConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [member2Id, setMember2Id] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const chatBoxRef = useRef(null);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUser(username || "");
    setCurrentUserId(userId || "");
    setMember2Id(memberId || "");
    setConnected(!!memberId);
  }, [memberId, username, userId]);

  useEffect(() => {
    if (!member2Id) {
      navigate("/dashboard/chat");
    }
  }, [member2Id, navigate]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUserId || !member2Id) return;
      const sortedChatId = [currentUserId, member2Id].sort().join("/");

      try {
        const privateKeyPem = localStorage.getItem("rsaPrivateKey");
        if (!privateKeyPem) {
          console.error("No private key found in localStorage");
          setMessages([]);
          return;
        }

        const response = await axios.get(
          `${API_BASE}/api/v1/personal_chat/all_messages/${sortedChatId}`,
          {
            withCredentials: true,
          }
        );

        if (Array.isArray(response.data)) {
          const decryptedMessages = await Promise.all(
            response.data.map(async (message) => {
              try {
                if (!message.content || typeof message.content !== "string") {
                  return { ...message, content: "[Invalid Content]" };
                }

                const decryptedContent = await decryptMessage(
                  message.content,
                  privateKeyPem
                );
                return { ...message, content: decryptedContent };
              } catch (decryptError) {
                console.error("Decryption error:", decryptError);
                return { ...message, content: "[Decryption Failed]" };
              }
            })
          );

          setMessages(decryptedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      }
    };

    if (connected) {
      loadMessages();
    }
  }, [currentUserId, member2Id, connected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUserId || !member2Id) return;

    const sortedChatId = [currentUserId, member2Id].sort().join("/");

    if (stompClientRef.current) {
      stompClientRef.current.disconnect();
      stompClientRef.current = null;
    }

    const socket = new SockJS(`${baseURL}/chat`);
    const client = Stomp.over(socket);

    client.connect({}, () => {
      stompClientRef.current = client;
      setConnected(true);
      toast.success("Connected to chat");

      client.subscribe(`/api/v1/topic/personal_chat/${sortedChatId}`, async (message) => {
        const newMessage = JSON.parse(message.body);
        const privateKeyPem = localStorage.getItem("rsaPrivateKey");
        try {
          const decryptMsg = await decryptMessage(newMessage.content, privateKeyPem);
          newMessage.content = decryptMsg;
          setMessages((prevMessages) => [...prevMessages, newMessage]);

          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } catch (error) {
          console.error("Decryption error:", error);
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...newMessage, content: "[Decryption Failed]" },
          ]);
        }
      });
    });

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
        stompClientRef.current = null;
        setConnected(false);
      }
    };
  }, [currentUserId, member2Id]);

  const sendMessage = async () => {
    if (stompClientRef.current && connected && input.trim()) {
      const publicKeyPem = localStorage.getItem(`publicKey:${memberName}`);
      if (!publicKeyPem) {
        console.error("No public key found for recipient");
        toast.error("Cannot send message: Recipient's public key not found");
        return;
      }

      try {
        const encryptedMsg = await encryptMessage(input, publicKeyPem);
    console.log("Original message:", input);
      console.log("Encrypted message (Base64):", encryptedMsg); // Log encrypted output
        const message = {
          sender: currentUser,
          content: encryptedMsg,
          timestamp: new Date().toISOString(),
        };
        const sortedChatId = [currentUserId, member2Id].sort().join("/");

        stompClientRef.current.send(
          `/app/personal_chat/send_message/${sortedChatId}`,
          {},
          JSON.stringify(message)
        );

        setInput("");
      } catch (error) {
        console.error("Encryption error:", error);
        toast.error("Failed to encrypt message");
      }
    }
  };

  const addEmoji = (emojiObject) => {
    setInput((prevInput) => prevInput + emojiObject.emoji);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="dark:border-gray-700 py-5 shadow flex justify-center items-center dark:bg-gray-900 pt-8">
        <Link to={`/dashboard/profile/${memberName}`}>
          <h1 className="text-2xl font-extrabold tracking-wide text-blue-400">
            {memberName}
          </h1>
        </Link>
      </header>

      <main
        ref={chatBoxRef}
        className="flex-1 px-10 py-4 dark:bg-slate-600 overflow-y-auto h-full max-h-[calc(100vh-160px)]"
      >
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === currentUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`my-2 ${
                  message.sender === currentUser ? "bg-green-800" : "bg-gray-800"
                } p-3 max-w-[75%] break-words rounded-lg`}
              >
                <div className="flex flex-col gap-2 items-start">
                  {/* Image + Username Row */}
                  <div className="flex items-center gap-2">
                    <Link to={`/dashboard/profile/${message.sender}`}>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={`https://github.com/${message.sender}.png`}
                        alt=""
                      />
                    </Link>
                    <p className="text-sm font-bold">{message.sender}</p>
                  </div>

                  {/* Message Content */}
                  <p className="whitespace-pre-wrap break-words text-left">
                    {message.content}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-400">
                    {timeAgo(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="w-full px-10 py-4 bg-gray-900 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-10 bg-gray-800 shadow-lg rounded-lg p-2">
            <EmojiPicker theme="dark" onEmojiClick={addEmoji} />
          </div>
        )}

        <div className="flex items-center gap-4 w-full mx-auto max-w-2xl bg-gray-800 p-3 rounded-full relative">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="dark:bg-yellow-600 h-10 w-10 flex justify-center items-center rounded-full"
          >
            <MdEmojiEmotions size={24} />
          </button>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            type="text"
            placeholder="Type your message here..."
            className="w-full bg-transparent text-white px-4 py-2 outline-none"
          />

          <button className="dark:bg-purple-600 h-10 w-10 flex justify-center items-center rounded-full">
            <MdAttachFile size={20} />
          </button>

          <button
            onClick={sendMessage}
            className="dark:bg-green-600 h-10 w-10 flex justify-center items-center rounded-full"
          >
            <MdSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalChatChat;