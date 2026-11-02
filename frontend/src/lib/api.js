import axios from "axios";
import { TRANSLATIONS } from "@/i18n/translations";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;
export const TOKEN_KEY = "sbft_token";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e, t) => {
  const d = e?.response?.data?.detail;
  return typeof d === "string" && TRANSLATIONS.it[d] ? t(d) : t("error_generic");
};

export const avatarUrl = (user, style, seed) => {
  if (!user) return "";
  if (!style && user.use_picture && user.picture) return user.picture;
  const s = style || user.avatar_style || "adventurer";
  const sd = seed || user.avatar_seed || user.name;
  return `https://api.dicebear.com/9.x/${s}/svg?seed=${encodeURIComponent(sd)}&backgroundColor=fce7f3,fdf2f8,ffe4e6`;
};

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const nextHour = () => `${String((new Date().getHours() + 1) % 24).padStart(2, "0")}:00`;

export const getPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 600000 },
    );
  });
