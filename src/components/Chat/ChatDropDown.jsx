import React, { useEffect, useState, useCallback } from "react";
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
import { set as idbSet, get as idbGet, createStore } from "idb-keyval";
import { getChatKeyFromIdb, storeSecretChatKeyInIdb, setDirectoryInIdb, getDirectoryFromIdb } from "../../config/IndexDb";
import { decryptMessage, encryptMessage } from "../../config/rasCrypto";
import { getUserPrivateKey } from "../../config/fileFunctions";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Create a dedicated IndexedDB store for public keys
const publicKeyStore = createStore("public-key", "documents");
const chatSecretKeyStore = createStore("chat-secret-key-store", "chat-secret-key");

function ChatDropDown() {
    const [personalChats, setPersonalChats] = useState([]);
    const [filteredPersonalChats, setFilteredPersonalChats] = useState([]);
    const [member2Id, setMember2Id] = useState("");
    const [member2Name, setMember2Name] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [personalChatOpen, setPersonalChatOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, username } = useAuth();
    const [directorySet, setDirectorySet] = useState(false);

        // Check if directory is set when the component mounts
    const checkDirectory = async () => {
        console.log("checkDirectory called");
        const directory = await getDirectoryFromIdb();
        if (directory) {
            setDirectorySet(true);
        } else {
            setDirectorySet(false);
        }
        setLoading(false);
    };

    // Run the check when the component mounts
    useEffect(() => {
        checkDirectory();
    }, []);

    // Function to handle directory selection on user action (e.g., button click)
    const handleSetDirectory = async () => {
        try {
            const baseDir = await window.showDirectoryPicker({ mode: "readwrite" });
            await setDirectoryInIdb(baseDir);
            setDirectorySet(true);
            console.log("Directory set successfully:", baseDir);
        } catch (error) {
            console.error("Error selecting directory:", error);
            alert("Failed to select directory. Please try again.");
        }
    };

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
                    const response = await axios.get(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`, {
                        withCredentials: true,
                    });
                    const sortedPersonalChat = response.data.sort((a, b) => {
                        const latestA = a.messages?.length ? new Date(a.messages[a.messages.length - 1].timestamp).getTime() : 0;
                        const latestB = b.messages?.length ? new Date(b.messages[b.messages.length - 1].timestamp).getTime() : 0;
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
                            setMember2Id(matchingChat.id);
                            setMember2Name(matchingChat.githubUserName);
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
            setPersonalChatOpen(true);
        }
    }, [member2Id, member2Name]);

    const handlePersonalChatClick = async (partnerName, chatId) => {
        setMember2Id(chatId);
        setMember2Name(partnerName);
        try {
            // 1) Try to get public key from IndexedDB
            let publicKeyPem = await idbGet(partnerName, publicKeyStore);
            let pkResp;
            if (!publicKeyPem) {
// 2) Fetch their public key PEM
                pkResp = await axios.get(`${API_BASE}/api/users/public_key/${partnerName}`, { withCredentials: true });
                await idbSet(partnerName, pkResp.data, publicKeyStore);
            }
            let secretB64;
            let chatSecretKey = await getChatKeyFromIdb(partnerName, chatSecretKeyStore);
            if (!chatSecretKey) {
                // Get encrypted secretKey from db
                const getRes = await axios.get(`${API_BASE}/api/secret_key/${chatId}/${userId}/`, {
                    withCredentials: true,
                    validateStatus: (s) => s < 500,
                });
                if (getRes.status === 200 && getRes.data) {
                    secretB64 = getRes.data;
                    await storeSecretChatKeyInIdb(partnerName, secretB64, chatSecretKeyStore);
                } else {
                    secretB64 = await generateBase64AesKey();
                    const encryptedSecretKey = await encryptMessage(secretB64, pkResp?.data || publicKeyPem);
                    const publicKey = await getPublicKey(username, API_BASE);
                    const encryptedSecretKey1 = await encryptMessage(secretB64, publicKey);
                    await axios.post(
                        `${API_BASE}/api/secret_key/${chatId}/${userId}/`,
                        { secretKey: encryptedSecretKey, secretKey1: encryptedSecretKey1 },
                        { headers: { "Content-Type": "application/json" }, withCredentials: true }
                    );
                    await storeSecretChatKeyInIdb(partnerName, encryptedSecretKey1, chatSecretKeyStore);
                }
            }
        } catch (err) {
            console.error("Error setting up chat key:", err);
        }
    };

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

    const getPublicKey = async (username, API_BASE) => {
        let publicKey = localStorage.getItem("rsaPublicKey");
        if (!publicKey) {
            try {
                const response = await fetch(`${API_BASE}/api/users/public_key/${username}`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    publicKey = await response.text();
                    localStorage.setItem("rsaPublicKey", publicKey);
                } else {
                    console.error("Public key not found in backend");
                    return null;
                }
            } catch (error) {
                console.error("Error fetching public key:", error);
                return null;
            }
        }
        return publicKey;
    };

    if (loading) {
        return (
            <GradientBackground>
                <div className="min-h-screen flex items-center justify-center text-white">
                    <div className="animate-pulse text-2xl">
                        Loading Personal Chats...
                    </div>
                </div>
            </GradientBackground>
        );
    }
    // Render the directory selection prompt if directory is not set
if (!directorySet) {
    return (
        <GradientBackground>
            <div className="flex flex-col h-screen text-white justify-center items-center px-4">
                <div className="fixed top-0 left-0 w-full z-50">
                    <Navigation />
                </div>
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-semibold mb-3">
                        Set Your Directory to Continue
                    </h2>
                    <p className="text-lg mb-4 leading-relaxed">
                        Please select the directory where <code className="bg-gray-700 px-1 rounded">data.codeamigoes</code> is located. If you've recently changed browsers or cleared your settings, you may need to reselect this directory.
                    </p>
                    <p className="text-sm text-gray-300 mb-6">
                        <span className="font-medium">Ex:</span> Look for a folder named <code className="bg-gray-700 px-1 rounded">data.codeamigoes</code> in your <code className="bg-gray-700 px-1 rounded" >project</code> directory, and select <code className="bg-gray-700 px-1 rounded" >project</code> folder to proceed.
                    </p>
                    <button
                        onClick={handleSetDirectory}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors transform hover:scale-105 duration-200 shadow-lg"
                    >
                        Select Directory
                    </button>
                </div>
            </div>
        </GradientBackground>
    );
}

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
                                            <div className="text-sm text-gray-400"></div>
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

export { publicKeyStore, chatSecretKeyStore };
export default ChatDropDown ;  