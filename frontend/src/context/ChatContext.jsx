import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

  const [roomId, setRoomId] = useState(null);
  const [currentUser, setCurrentUser] = useState("");
  const [connected, setConnected] = useState(false);
  const { username } = useAuth();
  // useEffect(() => {
  //   const user = localStorage.getItem("username")
  // }, [])
  return (
    <ChatContext.Provider
      value={{
        roomId,
        currentUser,
        connected,
        setRoomId,
        setCurrentUser,
        setConnected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

const useChatContext = () => useContext(ChatContext);
export default useChatContext;
