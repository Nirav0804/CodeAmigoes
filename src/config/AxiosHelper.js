import axios from "axios";
export const baseURL = "https://codeamigos-backend.onrender.com/api/v1";
export const httpClient = axios.create({
  baseURL: baseURL,
  withCredentials: true
});
