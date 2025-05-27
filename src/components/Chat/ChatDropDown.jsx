import React, { useEffect, useState, useCallback, use } from "react";
import Navigation from "../navigation/Navigation";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { FaSearch } from "react-icons/fa";
import GradientBackground from "../background/GradientBackground";
import { timeAgo } from "../../config/helper";
import PersonalChatChat from "../PersonalChat/PersonalChatChat";
import { LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { generateBase64AesKey } from "../../config/secretKeyGenerator";
import { set as idbSet, get as idbGet } from 'idb-keyval';
const API_BASE = import.meta.env.VITE_API_BASE_URL;
function ChatDropDown() {
    const [personalChats, setPersonalChats] = useState([]);
    const [filteredPersonalChats, setFilteredPersonalChats] = useState([]);
    const [member2Id, setMember2Id] = useState("");
    const [member2Name, setMember2Name] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [personalChatOpen, setPersonalChatOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    const { userId, username } = useAuth();
    // Initialize user and fetch chats
    useEffect(() => {
        const initialize = async () => {
            if (!username) {
                navigate("/");
                return;
            }
            setCurrentUserId(userId);

            if (userId) {
                try {

                    console.log(userId);

                    console.log(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`);

                    const response = await axios.get(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`, {
                        withCredentials: true, // <-- This sends cookies!
                    });
                    console.log(response.data);

                    const sortedPersonalChat = response.data
                        .sort((a, b) => {
                            const latestA = a.messages?.length
                                ? new Date(a.messages[a.messages.length - 1].timestamp).getTime()
                                : 0;
                            const latestB = b.messages?.length
                                ? new Date(b.messages[b.messages.length - 1].timestamp).getTime()
                                : 0;
                            return latestB - latestA;
                        });
                    setPersonalChats(sortedPersonalChat);
                    setFilteredPersonalChats(sortedPersonalChat);

                    // Process query parameter after chats are loaded
                    const queryParams = new URLSearchParams(location.search);
                    const leaderName = queryParams.get("leader");
                    if (leaderName && sortedPersonalChat.length > 0) {
                        const matchingChat = sortedPersonalChat.find(
                            (chat) => chat.githubUserName.toLowerCase() === leaderName.toLowerCase()
                        );
                        if (matchingChat) {
                            console.log("Matching chat found:", matchingChat);
                            setMember2Id(matchingChat.id);
                            setMember2Name(matchingChat.githubUserName); // Ensure this matches API response
                        } else {
                            console.log("No matching chat found for leader:", leaderName);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch personal chats:", error);
                }
            }
        };

        initialize();
    }, [navigate, location.search]);

    // Open chat when member2Id and member2Name are set
    useEffect(() => {
        if (member2Id && member2Name) {
            console.log("Opening chat for:", member2Name, member2Id);
            setPersonalChatOpen(true);
        }
    }, [member2Id, member2Name]);

  // main handler
  const handlePersonalChatClick = async (partnerName, chatId) => {
    setMember2Id(chatId);
    setMember2Name(partnerName);

    try {
      // 1) Fetch their public key PEM (optional here)
      const pkResp = await axios.get(
        `${API_BASE}/api/users/public_key/${partnerName}`,
        { withCredentials: true }
      );
      localStorage.setItem(`publicKey:${partnerName}`, pkResp.data);

      // 2) Try to GET an existing chat-secret from your backend
      let secretB64;
      const getRes = await axios.get(
        `${API_BASE}/api/secret_key/${chatId}/`,
        { 
          withCredentials: true,
          validateStatus: (s) => s < 500 
        } 
      );

      if (getRes.status === 200 && getRes.data) {
        // reuse
        secretB64 = getRes.data;
        console.log("Reusing existing chat key");
      } else {
        // generate + persist
        console.log("Generating new chat key");
        secretB64 = await generateBase64AesKey();
        await axios.post(
          `${API_BASE}/api/secret_key/${chatId}/`,
          secretB64,
          {
            headers: { "Content-Type": "text/plain" },
            withCredentials: true,
          }
        );
          // 3) Persist the Base64 secret in IndexedDB too,
 //    so we can recover it locally if the server is unreachable

      try{
        await idbSet(`chatKey:${chatId}`, secretB64);
        console.log(`🔒 Stored chatKey:${chatId} in IndexedDB`);
    }catch (e) {
      console.warn("Failed to write chat key to IndexedDB", e);
    }
      }

      // 4) Import the Base64 key into a CryptoKey
      const raw = Uint8Array.from(atob(secretB64), (c) =>
        c.charCodeAt(0)
      );
      const importedKey = await window.crypto.subtle.importKey(
        "raw",
        raw.buffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
      );
      setChatKey(importedKey);
    } catch (err) {
      console.error("Error setting up chat key:", err);
    }
  };


//    const handlePersonalChatClick = async (member2Name, id) => {
//     setMember2Id(id);
//     setMember2Name(member2Name);

//     try {
//         // Fetch the public key from backend
//         const res = await axios.get(`${API_BASE}/api/users/public_key/${member2Name}`, {
//   withCredentials: true  
// });
//         const publicKeyPem = res.data; // This should be the PEM string

//         // Store it in state, context, or pass to your chat component
//         localStorage.setItem(`publicKey:${member2Name}`, publicKeyPem);
//         // Or: setPublicKey(publicKeyPem); if you want to use React state

//         // Now you can use this publicKeyPem for RSA encryption when sending messages
//     } catch (err) {
//         console.error("Could not fetch public key for", member2Name, err);
//         // Handle error (show message to user, etc)
//     }
// };
    const debouncedSearch = useCallback(
        debounce((query) => {
            const filteredChats = personalChats.filter((chat) =>
                chat.githubUserName.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPersonalChats(filteredChats);
        }, 300),
        [personalChats]
    );

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        debouncedSearch(event.target.value);
    };

    return (
        <GradientBackground>
            <div className="flex flex-col h-screen text-white">
                <div className="fixed top-0 left-0 w-full z-50">
                    <Navigation />
                </div>

                <div className="flex flex-1 pt-20">
                    <div className="w-1/4 p-4 border-r bg-gray-900 border-gray-700 h-[calc(100vh-4rem)]">
                        <div className="mb-4 flex items-center bg-gray-800 px-3 py-2 rounded-lg">
                            <FaSearch className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="bg-transparent outline-none text-white w-full"
                                placeholder="Search chats..."
                            />
                        </div>

                        <div className="space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            {filteredPersonalChats.length > 0 ? (
                                filteredPersonalChats.map((personalChat) => (
                                    <div
                                        key={personalChat.id}
                                        className="p-3 bg-gray-700 shadow-lg rounded-lg flex items-center cursor-pointer hover:bg-gray-600 transition-all"
                                        onClick={() => handlePersonalChatClick(personalChat.githubUserName, personalChat.id)}
                                    >
                                        <img
                                            src={`https://github.com/${personalChat.githubUserName}.png`}
                                            alt={personalChat.githubUserName}
                                            className="w-12 h-12 rounded-full object-cover mr-3"
                                        />
                                        <div>
                                            <h3 className="text-md font-bold text-gray-200">{personalChat.githubUserName}</h3>
                                            <div className="text-sm text-gray-400">
                                                {/* {personalChat.messages?.length > 0 ? (
                                                    <>
                                                        <span className="font-semibold text-white">
                                                            {personalChat.messages[personalChat.messages.length - 1]?.sender || "Unknown"}:
                                                        </span>{" "}
                                                    </>
                                                ) : (
                                                    "No messages yet"
                                                )} */}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400">No Personal Chats found.</p>
                            )}
                        </div>
                    </div>

                    <div className="w-3/4 flex flex-col h-[calc(100vh-4rem)] text-center overflow-hidden justify-center">
                        {personalChatOpen ? (
                            <PersonalChatChat memberId={member2Id} memberName={member2Name} />
                        ) : (
                            <p className="text-lg text-gray-500">Select a Personal chat to continue</p>
                        )}
                    </div>
                </div>
            </div>
        </GradientBackground>
    );
}

export default ChatDropDown;