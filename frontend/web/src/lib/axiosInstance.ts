import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.API_URL, // ✅ should be a string, not { }
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
