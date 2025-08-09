"use client";
import { useState, useEffect } from "react";
import api from "@/utils/api";

export default function usePublicSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/public-settings");
        setSettings(res);
      } catch (err) {
        console.error("Failed to load public settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return loading ? null : settings;
}