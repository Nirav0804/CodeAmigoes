import React, { useEffect, useState, useCallback } from "react";
import Navigation from "../navigation/Navigation";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { FaSearch } from "react-icons/fa";
import GradientBackground from "../background/GradientBackground";
import { timeAgo } from "../../config/helper";
import PersonalChatChat from "../PersonalChat/PersonalChatChat";
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

    // Initialize user and fetch chats
    useEffect(() => {
        const initialize = async () => {
            const userId = localStorage.getItem("userId");
            const username = localStorage.getItem("username");
            if (!username) {
                navigate("/login");
                return;
            }
            setCurrentUserId(userId);

            if (userId) {
                try {
                    // Fetch personal chats
                    const response = await axios.get(`${API_BASE}/api/v1/personal_chat/all_personal_chats/${userId}`);
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

    const handlePersonalChatClick = (member2Name, id) => {
        localStorage.setItem("key", "W05eZAlBso9GxmeNkXOYf5whKff883TkQ/hsUn3QaBE7s3fJIxBLPz+9ETkypxOz")
        setMember2Id(id);
        setMember2Name(member2Name);
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