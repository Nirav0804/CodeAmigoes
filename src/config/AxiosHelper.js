import axios from "axios";
export const baseURL = "${API_BASE}/api/v1";
export const httpClient = axios.create({
  baseURL: baseURL,
  withCredentials: true
});
