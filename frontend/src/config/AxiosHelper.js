import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const baseURL = `${API_BASE}/api/v1`;
export const httpClient = axios.create({
  baseURL: baseURL,
  withCredentials: true
});
