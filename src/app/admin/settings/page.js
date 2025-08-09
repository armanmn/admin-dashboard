"use client";
import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import styles from "@/styles/settings.module.css";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [editMarkup, setEditMarkup] = useState(false);
  const [ratesMode, setRatesMode] = useState("auto");
  const [form, setForm] = useState({
    b2cMarkupPercentage: "",
    officeMarkupPercentage: "",
    USD: "",
    AMD: "",
  });

  // 📥 Load initial settings from backend
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/global-settings");
        setSettings(d);
        setRatesMode("auto");
        setForm({
          b2cMarkupPercentage: d.b2cMarkupPercentage,
          officeMarkupPercentage: d.officeMarkupPercentage,
          USD: d.exchangeRates.USD,
          EUR: d.exchangeRates.EUR,
          RUB: d.exchangeRates.RUB,
        });
      } catch (err) {
        console.error("Failed to load settings", err);
        alert("Սխալ տվյալների բեռնումիս");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 👆 Field change handler ensures no negative values
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === "" || Number(value) < 0) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValidMarkup = () =>
    form.b2cMarkupPercentage !== "" &&
    form.officeMarkupPercentage !== "";

  const isValidRates = () =>
    ratesMode === "auto" || (form.USD !== "" && form.EUR !== "" && form.RUB);

  // 💾 Unified save handler
  const handleSaveAll = async () => {
    if (!isValidMarkup() || !isValidRates()) {
      return alert("Խնդրում եմ լրացրեք բոլոր դաշտերը ճիշտ");
    }
    setLoading(true);
    try {
      const payload = {
        mode: ratesMode,
        rates: ratesMode === "manual"
          ? { USD: Number(form.USD), EUR: Number(form.EUR), RUB: Number(form.RUB) }
          : {},
        b2cMarkupPercentage: Number(form.b2cMarkupPercentage),
        officeMarkupPercentage: Number(form.officeMarkupPercentage),
      };

      const updated = await api.post("/global-settings", payload);
      setSettings(updated);
      setEditMarkup(false);
      alert("Պահպանվեց հաջողությամբ");
    } catch (err) {
      console.error("Save all failed", err);
      alert("Սխալ պահպանման ընթացքում");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) return <div className={styles.container}>Loading…</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Global Settings</h1>

      {/* Markup Settings */}
      <fieldset className={styles.fieldset}>
        <legend>Markup Settings</legend>
        {["b2cMarkupPercentage", "officeMarkupPercentage"].map((key) => (
          <div className={styles.formRow} key={key}>
            <label htmlFor={key}>
              {key === "b2cMarkupPercentage" ? "B2C Markup %" : "Office Markup %"}
            </label>
            {editMarkup ? (
              <input
                id={key}
                name={key}
                type="number"
                value={form[key]}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span className={styles.value}>{form[key]}%</span>
            )}
          </div>
        ))}
        <button
          className={styles.button}
          onClick={() => setEditMarkup((prev) => !prev)}
        >
          {editMarkup ? "Cancel Edit" : "Edit Markup"}
        </button>
      </fieldset>

      {/* Exchange Rates */}
      <fieldset className={styles.fieldset}>
        <legend>Exchange Rates (per AMD)</legend>
        <div className={styles.radioGroup}>
          {["auto", "manual"].map((m) => (
            <label key={m}>
              <input
                type="radio"
                name="ratesMode"
                value={m}
                checked={ratesMode === m}
                onChange={() => setRatesMode(m)}
              />{" "}
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </label>
          ))}
        </div>
        {["USD", "EUR", "RUB"].map((key) => (
          <div className={styles.formRow} key={key}>
            <label htmlFor={key}>{key} Rate</label>
            {ratesMode === "manual" ? (
              <input
                id={key}
                name={key}
                type="number"
                value={form[key]}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span className={styles.value}>
                {settings.exchangeRates?.[key] ?? "-"}
              </span>
            )}
          </div>
        ))}
      </fieldset>

      {/* Save Button */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.button}
          onClick={handleSaveAll}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save All Settings"}
        </button>
      </div>
    </div>
  );
}