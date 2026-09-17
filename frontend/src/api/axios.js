import axios from "axios";

// withCredentials so the httpOnly JWT cookie set by the backend is

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default api;
