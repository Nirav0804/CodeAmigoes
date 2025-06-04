import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../navigation/Navigation";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { FaSearch, FaArrowLeft, FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import GradientBackground from "../background/GradientBackground";
import PersonalChatChat from "../PersonalChat/PersonalChatChat";
import { useAuth } from "../../context/AuthContext";
import { generateBase64AesKey } from "../../config/secretKeyGenerator";
import { set as idbSet, get as idbGet, createStore } from "idb-keyval";
import { getChatKeyFromIdb, storeSecretChatKeyInIdb, setDirectoryInIdb, getDirectoryFromIdb } from "../../config/IndexDb";
import { encryptMessage } from "../../config/rasCrypto";
import { exportKeyAsPem } from "../../config/pemutils";
import { privateKeyFileName, passwordFileName } from "../../config/fileFunctions";
import { encryptWithAesKey, exportKeyToBase64, generateAesKey } from "../../config/passwordEncrypt";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const publicKeyStore = createStore("public-key", "documents");
const chatSecretKeyStore = createStore("chat-secret-key-store", "chat-secret-key");

export const isMobileDevice = () => {
    const ua = navigator.userAgent || "";
    const isAndroidPhone = /Android/i.test(ua) && /Mobile/i.test(ua);
    const isIPhoneOrIPod = /iPhone|iPod/i.test(ua);
    return isAndroidPhone || isIPhoneOrIPod;
};

export const isFileSystemSupported = () => ("showDirectoryPicker" in window);

function ChatDropDown() {
    const [personalChats, setPersonalChats] = useState([]);
    const [filteredPersonalChats, setFilteredPersonalChats] = useState([]);
    const [member2Id, setMember2Id] = useState("");
    const [member2Name, setMember2Name] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [personalChatOpen, setPersonalChatOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState("");
    const [loading, setLoading] = useState(true);
    const [isKeySetupComplete, setIsKeySetupComplete] = useState(false);
    const [showChatList, setShowChatList] = useState(true);
    const [isMobileView, setIsMobileView] = useState(false);
    const [directorySet, setDirectorySet] = useState(false);
    const [directoryExists, setDirectoryExists] = useState(true);
    const [errorType, setErrorType] = useState(null);
    const [noPublicKeyError, setNoPublicKeyError] = useState(false);
    const [pendingLeaderName, setPendingLeaderName] = useState(""); // Store leaderName if chats not loaded

    const navigate = useNavigate();
    const location = useLocation();
    const { userId, username } = useAuth();

    // Check screen size for mobile view
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Check compatibility and public key
    useEffect(() => {
        if (isMobileDevice() || !isFileSystemSupported()) {
            setErrorType(isMobileDevice() ? "mobile" : "filesystem");
            setLoading(false);
            return;
        }
        checkDirectory();
    }, [username]);

    // Check if public key exists and directory is valid
    const checkDirectory = async () => {
        try {
            const publicKeyResponse = await axios.get(`${API_BASE}/api/users/public_key/${username}`, {
                withCredentials: true,
                validateStatus: (status) => status < 500
            });
            if (publicKeyResponse.status !== 200 || !publicKeyResponse.data) {
                setNoPublicKeyError(true);
                setDirectorySet(false);
                setLoading(false);
                return;
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setNoPublicKeyError(true);
                setDirectorySet(false);
                setLoading(false);
                return;
            } else {
                console.error("Error checking public key:", error);
                setDirectorySet(false);
                setDirectoryExists(false);
                setLoading(false);
                return;
            }
        }

        const directoryHandle = await getDirectoryFromIdb(username);
        if (!directoryHandle) {
            setDirectorySet(false);
            setDirectoryExists(false);
            setLoading(false);
            return;
        }

        try {
            const userDirName = `${username}.data.codeamigoes`;
            const userDirHandle = await directoryHandle.getDirectoryHandle(userDirName, { create: false });
            const privateDataDirHandle = await userDirHandle.getDirectoryHandle("privateData", { create: false });
            const rsaFileHandle = await privateDataDirHandle.getFileHandle("rsaPrivateEncryptedKey.json", { create: false });
            const aesFileHandle = await privateDataDirHandle.getFileHandle("aesPassword.key", { create: false });

            if (rsaFileHandle && aesFileHandle) {
                setDirectorySet(true);
                setDirectoryExists(true);
            } else {
                await generateKeys(directoryHandle);
                setDirectorySet(true);
                setDirectoryExists(true);
            }
        } catch (error) {
            console.error("Error checking directory:", error);
            if (error.name === 'NotFoundError') {
                await generateKeys(directoryHandle);
                setDirectorySet(true);
                setDirectoryExists(true);
            } else {
                setDirectorySet(false);
                setDirectoryExists(true);
            }
        }
        setLoading(false);
    };

    // Generate and store RSA keys
    const generateKeys = async (directory) => {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1,0,1]),
                    hash: 'SHA-256'
                },
                true,
                ['encrypt','decrypt']
            );

            const publicPem = await exportKeyAsPem(keyPair.publicKey, 'PUBLIC');
            const privatePem = await exportKeyAsPem(keyPair.privateKey, 'PRIVATE');
            localStorage.setItem('rsaPublicKey', publicPem);

            const dataDir = await directory.getDirectoryHandle(`${username}.data.codeamigoes`, { create: true });
            const privDir = await dataDir.getDirectoryHandle('privateData', { create: true });

            const secretPassword = await generateAesKey();
            const exportedPassword = await exportKeyToBase64(secretPassword);
            const encryptedPrivateKey = await encryptWithAesKey(privatePem, secretPassword);

            const privFH = await privDir.getFileHandle(privateKeyFileName, { create: true });
            const privW = await privFH.createWritable();
            await privW.write(JSON.stringify(encryptedPrivateKey, null, 2));
            await privW.close();

            const pwFH = await privDir.getFileHandle(passwordFileName, { create: true });
            const pwW = await pwFH.createWritable();
            await pwW.write(exportedPassword);
            await pwW.close();

            await axios.post(
                `${API_BASE}/api/users/public_key/${username}`,
                publicPem,
                { 
                    withCredentials: true, 
                    headers: { "Content-Type": "application/json" }
                }
            );
            setNoPublicKeyError(false);
            console.log("Public key successfully generated and stored in database.");
        } catch (error) {
            console.error("Error generating keys:", error);
            throw error;
        }
    };

    // Handle directory selection
    const handleSetDirectory = async () => {
        try {
            const baseDir = await window.showDirectoryPicker({ mode: "readwrite" });
            await setDirectoryInIdb(username, baseDir);
            const publicKeyResponse = await axios.get(`${API_BASE}/api/users/public_key/${username}`, {
                withCredentials: true,
                validateStatus: (status) => status < 500
            });
            if (publicKeyResponse.status !== 200 || !publicKeyResponse.data) {
                await generateKeys(baseDir);
            }
            setDirectorySet(true);
            setDirectoryExists(true);
            setNoPublicKeyError(false);
            await checkDirectory();
        } catch (error) {
            console.error("Error selecting directory:", error);
            alert("Failed to select directory. Please try again.");
        }
    };

    // Initialize chats and handle leaderName
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

                    const queryParams = new URLSearchParams(location.search);
                    const leaderName = queryParams.get("leader");
                    if (leaderName) {
                        setPendingLeaderName(leaderName); // Store for retry
                        const matchingChat = sortedPersonalChat.find(
                            (chat) => chat.githubUserName.toLowerCase() === leaderName.toLowerCase()
                        );
                        if (matchingChat) {
                            setMember2Id(matchingChat.id);
                            setMember2Name(matchingChat.githubUserName);
                            setPendingLeaderName(""); // Clear after success
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch personal chats:", error);
                }
            }
        };
        if (!errorType && !noPublicKeyError && !loading) initialize();
    }, [navigate, location.search, userId, username, errorType, noPublicKeyError, loading]);

    // Retry leaderName if pending
    useEffect(() => {
        if (pendingLeaderName && personalChats.length > 0 && directorySet) {
            const matchingChat = personalChats.find(
                (chat) => chat.githubUserName.toLowerCase() === pendingLeaderName.toLowerCase()
            );
            if (matchingChat) {
                setMember2Id(matchingChat.id);
                setMember2Name(matchingChat.githubUserName);
                setPendingLeaderName("");
            }
        }
    }, [pendingLeaderName, personalChats, directorySet]);

    // Setup chat keys
    useEffect(() => {
        if (member2Id && member2Name) {
            setIsKeySetupComplete(false);
            setupChatKeys(member2Name, member2Id).then(() => {
                setIsKeySetupComplete(true);
            }).catch((err) => {
                console.error("Key setup failed:", err);
                setIsKeySetupComplete(false);
            });
        }
    }, [member2Id, member2Name]);

    // Toggle mobile view
    useEffect(() => {
        if (member2Id && member2Name) {
            setPersonalChatOpen(true);
            if (isMobileView) setShowChatList(false);
        }
    }, [member2Id, member2Name, isMobileView]);

    const setupChatKeys = async (partnerName, chatId) => {
        try {
            let publicKeyPem = await idbGet(partnerName, publicKeyStore);
            let pkResp;
            if (!publicKeyPem) {
                pkResp = await axios.get(`${API_BASE}/api/users/public_key/${partnerName}`, { withCredentials: true });
                if (!pkResp.data) throw new Error("Public key not found for partner");
                await idbSet(partnerName, pkResp.data, publicKeyStore);
            }
            let secretB64;
            let chatSecretKey = await getChatKeyFromIdb(username, partnerName, chatSecretKeyStore);
            
            if (!chatSecretKey) {
                const getRes = await axios.get(`${API_BASE}/api/secret_key/${chatId}/${userId}/`, {
                    withCredentials: true,
                    validateStatus: (s) => s < 500,
                });
                if (getRes.status === 200 && getRes.data) {
                    secretB64 = getRes.data;
                    await storeSecretChatKeyInIdb(username, partnerName, secretB64, chatSecretKeyStore);
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
                    await storeSecretChatKeyInIdb(username, partnerName, encryptedSecretKey1, chatSecretKeyStore);
                }
            }
        } catch (err) {
            console.error("Error setting up chat key:", err);
            throw err;
        }
    };

    const handlePersonalChatClick = async (partnerName, chatId) => {
        setMember2Id(chatId);
        setMember2Name(partnerName);
        setPendingLeaderName(""); // Clear pending leader to avoid conflicts
    };

    const handleBackToChats = () => {
        setPersonalChatOpen(false);
        setMember2Id("");
        setMember2Name("");
        setShowChatList(true);
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
                    <div className="animate-pulse text-xl sm:text-2xl">
                        Loading Personal Chats...
                    </div>
                </div>
            </GradientBackground>
        );
    }

    if (errorType) {
        return (
            <GradientBackground>
                <div className="flex flex-col min-h-screen text-white relative">
                    <div className="fixed top-0 left-0 w-full z-50">
                        <Navigation />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md sm:max-w-lg px-4">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                                Unsupported Device or Browser
                            </h2>
                            <p className="text-base sm:text-lg mb-4 leading-snug">
                                Personal chats require Chrome, Edge, or Opera on a desktop with file system access.
                            </p>
                            {errorType === "mobile" && (
                                <p className="text-sm text-gray-300 mb-6">
                                    If you're using a supported browser with developer tools open, please close them and try again.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </GradientBackground>
        );
    }

    if (noPublicKeyError) {
        return (
            <GradientBackground>
                <div className="flex flex-col min-h-screen text-white justify-center items-center px-4">
                    <div className="fixed top-0 left-0 w-full z-50">
                        <Navigation />
                    </div>
                    <div className="text-center max-w-md sm:max-w-lg px-4">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                            No Encryption Keys Found
                        </h2>
                        <p className="text-base sm:text-lg mb-4 leading-relaxed">
                            Please select a directory to store your encryption keys. This will create a secure folder for chat encryption. Be sure to remember this location, as modifying or losing access to it may prevent you from using personal chats.
                        </p>
                        <p className="text-sm text-gray-300 mb-6">
                            Your username is <code className="bg-gray-700 px-1 rounded">{username}</code>. Choose a folder (e.g., <code className="bg-gray-700 px-1 rounded">project</code>) to store <code className="bg-gray-700 px-1 rounded">{username}.data.codeamigoes</code>.
                        </p>
                        <p className="text-sm text-gray-300 mb-6">
                            Need assistance? Contact us at <a href="mailto:codeamigos7@gmail.com" className="text-blue-400 hover:underline">codeamigos7@gmail.com</a>.
                        </p>
                        <button
                            onClick={handleSetDirectory}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors transform hover:scale-105 duration-200 shadow-lg text-sm sm:text-base"
                        >
                            Select Directory
                        </button>
                    </div>
                </div>
            </GradientBackground>
        );
    }

    if (!directorySet) {
        return (
            <GradientBackground>
                <div className="flex flex-col min-h-screen text-white justify-center items-center px-4">
                    <div className="fixed top-0 left-0 w-full z-50">
                        <Navigation />
                    </div>
                    <div className="text-center max-w-md sm:max-w-lg px-4">
                        {directoryExists ? (
                            <>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                                    Incorrect Directory or Missing Files
                                </h2>
                                <p className="text-base sm:text-lg mb-4 leading-relaxed">
                                    The selected directory is missing required files. Please choose the folder containing <code className="bg-gray-700 px-1 rounded text-sm">{username}.data.codeamigoes</code>, which should include a <code className="bg-gray-700 px-1 rounded text-sm">privateData</code> folder with <code className="bg-gray-700 px-1 rounded text-sm">rsaPrivateEncryptedKey.json</code> and <code className="bg-gray-700 px-1 rounded text-sm">aesPassword.key</code>.
                                </p>
                                <p className="text-sm text-green-300 mb-6">
                                    Your username is <code className="bg-gray-700 px-1 rounded">{username}</code>. Select the folder (e.g., <code className="bg-gray-700 px-1 rounded">project</code>) containing <code className="bg-blue-700 px-1 rounded">{username}.data.codeamigoes</code>.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                                    No Directory Selected
                                </h2>
                                <p className="text-base sm:text-lg mb-4 leading-relaxed">
                                    Please select the folder containing <code className="bg-gray-700 px-1 rounded text-sm">{username}.data.codeamigoes</code>, which includes a <code className="bg-gray-700 px-1 rounded text-sm">privateData</code> folder with <code className="bg-gray-700 px-1 rounded text-sm">rsaPrivateEncryptedKey.json</code> and <code className="bg-gray-700 px-1 rounded text-sm">aesPassword.key</code>.
                                </p>
                                <p className="text-sm text-gray-300 mb-6">
                                    Your username is <code className="bg-gray-700 px-1 rounded">{username}</code>. Select a folder (e.g., <code className="bg-gray-700 px-1 rounded">project</code>) containing <code className="bg-gray-700 px-1 rounded">{username}.data.codeamigoes</code>.
                                </p>
                            </>
                        )}
                        <p className="text-sm text-gray-300 mb-6">
                            Need assistance? Contact us at <a href="mailto:codeamigos7@gmail.com" className="text-blue-400 hover:underline">codeamigos7@gmail.com</a>.
                        </p>
                        <button
                            onClick={handleSetDirectory}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors transform hover:scale-105 duration-200 shadow-lg text-sm sm:text-base"
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
            <div className="flex flex-col min-h-screen text-white">
                <div className="fixed top-0 left-0 w-full z-50">
                    <Navigation />
                </div>
                <div className="flex flex-1 pt-16 sm:pt-20">
                    <div className={`
                        ${isMobileView ? (showChatList ? 'block' : 'hidden') : 'block'}
                        ${isMobileView ? 'w-full' : 'w-full md:w-1/3 lg:w-1/4'}
                        p-2 sm:p-4 
                        ${!isMobileView ? 'border-r border-gray-700' : ''}
                        bg-gray-900 
                        ${isMobileView ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-5rem)]'} 
                        overflow-y-auto
                    `}>
                        <div className="mb-3 sm:mb-4 flex items-center bg-gray-800 px-3 py-2 rounded-lg">
                            <FaSearch className="text-gray-400 mr-2 text-sm sm:text-base" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="bg-transparent outline-none text-white w-full text-sm sm:text-base"
                                placeholder="Search chats..."
                            />
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            {filteredPersonalChats.length > 0 ? (
                                filteredPersonalChats.map((personalChat) => (
                                    <div
                                        key={personalChat.id}
                                        className="p-3 bg-gray-700 shadow-lg rounded-lg flex items-center cursor-pointer hover:bg-gray-600 transition-all active:bg-gray-500"
                                        onClick={() => handlePersonalChatClick(personalChat.githubUserName, personalChat.id)}
                                    >
                                        <img
                                            src={`https://github.com/${personalChat.githubUserName}.png`}
                                            alt={personalChat.githubUserName}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-md font-bold text-gray-200 truncate">
                                                {personalChat.githubUserName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-400 truncate">
                                                Tap to open chat
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-8 text-sm sm:text-base">
                                    No Personal Chats found.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={`
                        ${isMobileView ? (showChatList ? 'hidden' : 'block') : 'block'}
                        ${isMobileView ? 'w-full' : 'flex-1'}
                        flex flex-col 
                        ${isMobileView ? 'h-[calc(100vh-4rem)]' : 'h-[calc(100vh-5rem)]'}
                        overflow-hidden 
                        ${!personalChatOpen ? 'justify-center items-center' : ''}
                        bg-gray-800
                    `}>
                        {personalChatOpen ? (
                            <PersonalChatChat
                                memberId={member2Id}
                                memberName={member2Name}
                                isKeySetupComplete={isKeySetupComplete}
                                onBackClick={isMobileView ? handleBackToChats : null}
                                isMobile={isMobileView}
                            />
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-base sm:text-lg text-gray-500">
                                    Select a Personal chat to continue
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                                    Choose a conversation from the list to start chatting
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GradientBackground>
    );
}

export { publicKeyStore, chatSecretKeyStore };
export default ChatDropDown;

/*
Flow of the Code:
1. **Initialization**:
   - Check if the browser supports File System API and is not a mobile device.
   - If unsupported, display an error message and halt further execution.
   - If supported, proceed to check the directory stored in IndexedDB for the current user.

2. **Directory Check (checkDirectory)**:
   - Retrieve the directory handle from IndexedDB using the username.
   - If no directory is set, prompt the user to select one and set `directorySet` to false.
   - If a directory exists, verify the structure (`{username}.data.codeamigoes/privateData`) and required files (`rsaPrivateEncryptedKey.json`, `aesPassword.key`).
   - If files are missing or the structure is invalid, call `generateKeys` to create them.

3. **Key Generation (generateKeys)**:
   - Query the backend (`GET /api/users/public_key/{username}`) to check if the public key exists.
   - If the key exists (200 OK), log and return, proceeding with the chat flow.
   - If the key is missing (404), generate an RSA key pair, encrypt the private key with AES, store both in the directory, and send the public key to the backend (`POST /api/users/public_key/{username}`).

4. **Chat Loading**:
   - Fetch all personal chats for the user from the backend and sort them by the latest message timestamp.
   - Filter chats based on search input and display them in the UI.

5. **Chat Selection**:
   - When a chat is selected, set up chat-specific keys (`setupChatKeys`) and open the personal chat view.
   - On mobile, hide the chat list and show the chat view; on desktop, display both side by side.

6. **Rendering**:
   - If loading, show a loading spinner.
   - If no directory is set, prompt the user to select one.
   - Otherwise, render the chat list and selected chat view, adjusting layout for mobile or desktop.
*/