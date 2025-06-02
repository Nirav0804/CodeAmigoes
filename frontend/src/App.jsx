import React, { StrictMode } from "react";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import { useNavigate } from "react-router-dom";
import { httpClient } from "./config/AxiosHelper";
import { useAuth } from "./context/AuthContext";

function App() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, []);

  return (
    <>
      <LandingPage />
    </>
  );
}

export default App;
