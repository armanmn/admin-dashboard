// src/components/AI/AISmartSearch.js
"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/aiSmartSearch.module.css";
import api from "@/utils/api";

const AISmartSearch = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState(null);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get("/hotels/locations");
        setCities(res);
      } catch (error) {
        console.error("❌ Failed to load cities:", error);
      }
    };

    fetchCities();
  }, []);

  const monthToNumber = (m) => {
    const months = {
      jan: "01",
      january: "01",
      feb: "02",
      february: "02",
      mar: "03",
      march: "03",
      apr: "04",
      april: "04",
      may: "05",
      jun: "06",
      june: "06",
      jul: "07",
      july: "07",
      aug: "08",
      august: "08",
      sep: "09",
      september: "09",
      oct: "10",
      october: "10",
      nov: "11",
      november: "11",
      dec: "12",
      december: "12",
    };
    return months[m.toLowerCase()] || "01";
  };

  const handleSearch = () => {
    const result = {
      destination: null,
      checkInDate: null,
      checkOutDate: null,
      adults: null,
      children: null,
      rooms: 1, // default to 1
    };

    const lower = query.toLowerCase();

    const cityMatch = cities.find((city) => lower.includes(city.toLowerCase()));
    if (cityMatch) result.destination = cityMatch.toLowerCase();

    const cleanQuery = query.replace(/\u2013/g, "-").toLowerCase();
    const year = new Date().getFullYear();

    // ✅ Variant 1: 28 May to 6 Jun (cross-month)
    const crossMonthMatch = cleanQuery.match(
      /(\d{1,2})\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s?(?:to|-)\s?(\d{1,2})\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/
    );
    if (crossMonthMatch) {
      const fromDay = String(crossMonthMatch[1]).padStart(2, "0");
      const fromMonth = monthToNumber(crossMonthMatch[2]);
      const toDay = String(crossMonthMatch[3]).padStart(2, "0");
      const toMonth = monthToNumber(crossMonthMatch[4]);
      result.checkInDate = `${year}-${fromMonth}-${fromDay}`;
      result.checkOutDate = `${year}-${toMonth}-${toDay}`;
    }

    // ✅ Variant 2: May 10 to 15 (same month)
    else {
      const singleMonthMatch = cleanQuery.match(
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s?(\d{1,2})\s?(?:to|-)\s?(\d{1,2})/
      );
      if (singleMonthMatch) {
        const month = monthToNumber(singleMonthMatch[1]);
        const fromDay = String(singleMonthMatch[2]).padStart(2, "0");
        const toDay = String(singleMonthMatch[3]).padStart(2, "0");
        result.checkInDate = `${year}-${month}-${fromDay}`;
        result.checkOutDate = `${year}-${month}-${toDay}`;
      }
    }

    // ✅ Variant 3: 10 to 15 May (same month)
    if (!result.checkInDate || !result.checkOutDate) {
      const reverseMatch = cleanQuery.match(
        /(\d{1,2})\s?(?:to|-)\s?(\d{1,2})\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/
      );
      if (reverseMatch) {
        const fromDay = String(reverseMatch[1]).padStart(2, "0");
        const toDay = String(reverseMatch[2]).padStart(2, "0");
        const month = monthToNumber(reverseMatch[3]);
        result.checkInDate = `${year}-${month}-${fromDay}`;
        result.checkOutDate = `${year}-${month}-${toDay}`;
      }
    }

    const adultsMatch = lower.match(/(\d+)\s*adults?|adults?\s*(\d+)/);
    if (adultsMatch) result.adults = parseInt(adultsMatch[1] || adultsMatch[2]);

    const kidsMatch = lower.match(
      /(\d+)\s*(children|kids|kid)|(?:children|kids|kid)\s*(\d+)/
    );
    if (kidsMatch) result.children = parseInt(kidsMatch[1] || kidsMatch[3]);

    const rooms = lower.match(/(\d+)\s*rooms?/);
    if (rooms) result.rooms = parseInt(rooms[1]);

    if (lower.includes("family")) {
      result.adults = result.adults || 2;
      result.children = result.children || 2;
    }
    if (lower.includes("couple")) {
      result.adults = result.adults || 2;
    }

    console.log("🧠 Parsed AI Search:", result);
    setParsed(result);
    if (onSearch) onSearch(result); // Pass to parent to trigger autofill + search
  };

  return (
    <div className={styles.aiContainer}>
      <h3 className={styles.heading}>inLobby AI Smart Search</h3>
      <div className={styles.inputRow}>
        <input
          type="text"
          placeholder="Try: Zurich Dec 10-15, 2 adults, 1 kid"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
        <button className={styles.searchBtn} onClick={handleSearch}>
          🔍 Smart Search
        </button>
      </div>

      
    </div>
  );
};

export default AISmartSearch;
