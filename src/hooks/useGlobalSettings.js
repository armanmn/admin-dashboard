// src/hooks/useGlobalSettings.js
import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function useGlobalSettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/global-settings");
        console.log("✅ fetchSettings response:", res);
        setSettings(res); // Փորձենք հենց res-ը
      } catch (error) {
        console.error("❌ Failed to fetch global settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return settings;
}