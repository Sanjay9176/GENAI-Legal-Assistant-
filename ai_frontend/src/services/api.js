// src/services/api.js
import axios from "axios";

// 1. Create the Axios Instance
// Connects to your FastAPI backend running on port 8000
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor (The Security Guard)
// Before sending ANY request, check if we have a token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (The Global Error Handler)
api.interceptors.response.use(
  (response) => response, // Return success responses as is
  (error) => {
    
    // A. Handle Rate Limits (429)
    // Prevents the app from crashing when the AI service is busy
    if (error.response && error.response.status === 429) {
      console.error("⚠️ Rate Limit Exceeded");
      alert("Server is busy (Rate Limit). Please wait 5 seconds and try again.");
    }

    // B. Handle Unauthorized (401)
    // Force logout if the token is expired or invalid
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Unauthorized: Token expired or invalid.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // C. Handle Data Validation Errors (422)
    // Log detailed backend validation errors for easier debugging
    if (error.response && error.response.status === 422) {
        console.error("⚠️ Data Validation Error (422):", error.response.data);
    }

    // Pass the error back to the specific component calling the API
    return Promise.reject(error);
  }
);

export default api;