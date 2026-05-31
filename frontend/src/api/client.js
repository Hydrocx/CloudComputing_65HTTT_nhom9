import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const TOKEN_KEY = "educloud_token";
const USER_KEY = "educloud_user";

const encodeBase64 = (value) => {
  const encoded = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode("0x" + p1)
  );
  return btoa(encoded);
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = getStoredUser();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (user) {
    config.headers["x-dev-user"] = encodeBase64(JSON.stringify(user));
  }

  return config;
});

export default client;
