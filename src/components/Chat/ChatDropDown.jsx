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
import { set as idbSet, get as idbGet , createStore } from 'idb-keyval';
import { getChatKeyFromIdb, storeSecretChatKeyInIdb,setDirectoryInIdb,getDirectoryFromIdb } from "../../config/IndexDb";
import { decryptMessage, encryptMessage } from "../../config/rasCrypto";
import { getUserPrivateKey } from '../../config/fileFunctions';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Create a dedicated IndexedDB store for public keys
const publicKeyStore = createStore('public-key', 'documents');
const chatSecretKeyStore = createStore('chat-secret-key-store', 'chat-secret-key');

function ChatDropDown() {
    const [personalChats, setPersonalChats] = useState([]);
    const [filteredPersonalChats, setFilteredPersonalChats] = useState([]);
    const [member2Id, setMember2Id] = useState("");
    const [member2Name, setMember2Name] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [personalChatOpen, setPersonalChatOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    // const [partnerPublicKey, setPartnerPublicKey] = useState("") // 
    // const [partnerChatSecretKey, setPartnerChatSecretKey] = useState("") // 
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
    };

    // Run the check when the component mounts
    useEffect(() => {
        checkDirectory();
    }, []);

    // Function to handle directory selection on user action (e.g., button click)
    const handleSetDirectory = async () => {
        try {
            const baseDir = await window.showDirectoryPicker({ mode: 'readwrite' });
            await setDirectoryInIdb(baseDir); // Store the selected directory
            setDirectorySet(true); // Update state to reflect the directory is set
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
                    console.log(userId);
                    console.log(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`);

                    const response = await axios.get(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`, {
                        withCredentials: true,
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
                            setMember2Name(matchingChat.githubUserName);
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

    // Main handler
    const handlePersonalChatClick = async (partnerName, chatId) => {
        setMember2Id(chatId);
        setMember2Name(partnerName);
        console.log("handle member2Id: " + chatId);
        console.log("handle userId: " + userId);

        try {
             // 1) Try to get public key from IndexedDB
            let publicKeyPem = await idbGet(partnerName, publicKeyStore);
            console.log("publicKeyPem",publicKeyPem);
            let pkResp;
            if(publicKeyPem){
                console.log("PublicKeyHi");
                console.log(publicKeyPem);
                // setPartnerPublicKey(publicKeyPem);
                // console.log("Partner public key set ",partnerPublicKey);
                
            }else{
                // 1) Fetch their public key PEM (optional here)
                pkResp = await axios.get(
                `${API_BASE}/api/users/public_key/${partnerName}`,
                { withCredentials: true }
            );
            console.log("Pkresp: ",pkResp.data);
            // console.log("partnerPublicKey set",partnerPublicKey);
            
             // Store in IndexedDB public-key store
             // setPartnerPublicKey(pkResp.data)
            await idbSet(partnerName, pkResp.data, publicKeyStore);
            console.log("set partner Public Key in setPartner"+pkResp.data);
            }

            // public key done
            
            // 2) Try to GET an existing chat-secret from your backend
            let secretB64;
            let chatSecretKey = await getChatKeyFromIdb(partnerName, chatSecretKeyStore);
            if(chatSecretKey){
                
             //setPartnerChatSecretKey(chatSecretKey);
                // console.log("FoundChatSecretKey",partnerChatSecretKey);
            }else{
                // Get secretKey from db
                const getRes = await axios.get(
                `${API_BASE}/api/secret_key/${chatId}/${userId}/`,
                {
                    withCredentials: true,
                    validateStatus: (s) => s < 500
                }
            );

            if (getRes.status === 200 && getRes.data) {
                // Reuse
                const encryptedChatKey = getRes.data
                secretB64 = getRes.data;
                console.log("Reusing existing chat key");
                  const privateKey = await getUserPrivateKey();
                //const decreyptedChatKey = await decryptMessage(encryptedChatKey,privateKey);
                // Set Chat Secret Key in IDB
                
                await storeSecretChatKeyInIdb(partnerName,encryptedChatKey,chatSecretKeyStore)
                // setPartnerChatSecretKey(secretB64);
                // console.log(`Stored secretKey:${partnerName} : ${partnerChatSecretKey} in IndexDb`);
            } else {
                // Generate + persist + encrypt with receiver's public key + encrypt with our public key 
                console.log("Generating new chat key");
                secretB64 = await generateBase64AesKey();
                console.log(`pkResp: ${pkResp}`);
                console.log(`secretB64: ${secretB64}`);
                // encrypt with both users public key
                console.log("PublicKeyPem in ChatDropDown ",publicKeyPem);
                console.log("PkResp.data in ChatDropDown ",pkResp?.data);

                const encryptedSecretKey = await encryptMessage(secretB64,pkResp?.data || publicKeyPem );
                
                     const getPublicKey = async (username, API_BASE) => {
                    console.log("inside getpublic key")
                    let publicKey = localStorage.getItem('rsaPublicKey');
                    if (!publicKey) {
                        try {
                        const response = await fetch(`${API_BASE}/api/users/public_key/${username}`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        if (response.ok) {
                            publicKey = await response.text();
                            localStorage.setItem('rsaPublicKey', publicKey);
                        } else {
                            console.error('Public key not found in backend');
                            return null;
                        }
                        } catch (error) {
                        console.error('Error fetching public key:', error);
                        return null;
                        }
                    }
                return publicKey;
                };

// Usage:
const publicKey = await getPublicKey(username, API_BASE);
                const encryptedSecretKey1 = await encryptMessage(secretB64,publicKey);

                console.log("Encrypted Secret Key: ",encryptedSecretKey,encryptedSecretKey1);
                await axios.post(
                    `${API_BASE}/api/secret_key/${chatId}/${userId}/`,{
                        secretKey:encryptedSecretKey,  // ## Encrypt with public key1
                        secretKey1:encryptedSecretKey1   // ## Encrypt with public key2
                    },
                    {
                        headers: { "Content-Type": "application/json" },
                        withCredentials: true,
                    }
                );
                // Store the newly generated secret key in IndexDb
                // localStorage.setItem(`secretKey:${partnerName}`, secretB64);
                 // Generateed and  Set Chat Secret Key in IDB 

                 // Encrypt with private Key of currentUSer and store in indexDb
                 console.log("inchatdropdown"+username);
                await storeSecretChatKeyInIdb(partnerName,encryptedSecretKey1,chatSecretKeyStore)
                
                // setPartnerChatSecretKey(secretB64);
                // console.log(`Generated and Stored secretKey:${partnerName}:${partnerChatSecretKey} in indexDb`);
                }
            }

            // // 4) Import the Base64 key into a CryptoKey
            // const raw = Uint8Array.from(atob(secretB64), (c) =>
            //     c.charCodeAt(0)
            // );
            // const importedKey = await window.crypto.subtle.importKey(
            //     "raw",
            //     raw.buffer,
            //     { name: "AES-GCM" },
            //     true,
            //     ["encrypt", "decrypt"]
            // );
            // setChatKey(importedKey); // Note: setChatKey is undefined; this might need to be defined elsewhere
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
// Render the directory selection prompt if directory is not set
    if (!directorySet) {
        return (
            <GradientBackground>
                <div className="flex flex-col h-screen text-white justify-center items-center">
                    <p className="text-lg mb-4">Directory not set. Please select a directory to continue.</p>
                    <button
                        onClick={handleSetDirectory}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                    >
                        Select Directory
                    </button>
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
export{publicKeyStore,chatSecretKeyStore}
export default ChatDropDown;