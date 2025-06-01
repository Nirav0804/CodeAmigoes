// apiEndpoints.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getUserFrameworks = async (username) => {
    try {
        const response = await axios.get(`${API_BASE}/api/frameworks/users?username=${username}`,{withCredentials:true});
        // console.log(response);
        return response.data.data.frameworkUsage;
    } catch (error) {
        // console.log("Error in userFrameworks api", error);
        return error?.response?.data || null; // safer error access
    }
};
