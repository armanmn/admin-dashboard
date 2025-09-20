// src/app/admin/settings/page.js
"use client";
import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import styles from "@/styles/settings.module.css";

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const abs = d.toLocaleString();
    // փոքր “relative” հուշում
    const diff = Date.now() - d.getTime();
    const mins = Math.round(diff / 60000);
    let rel =
      mins < 60
        ? `${mins}m ago`
        : mins < 1440
        ? `${Math.round(mins / 60)}h ago`
        : `${Math.round(mins / 1440)}d ago`;
    return `${abs} (${rel})`;
  } catch {
    return String(iso);
  }
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [editMarkup, setEditMarkup] = useState(false);
  const [ratesMode, setRatesMode] = useState("auto");

  const [form, setForm] = useState({
    b2cMarkupPercentage: "",
    officeMarkupPercentage: "",
    USD: "",
    EUR: "",
    RUB: "",
    GBP: "",
  });

  // 📥 Load initial settings from backend
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await api.get("/global-settings"); // returns full GlobalSettings doc
        setSettings(d);
        setRatesMode(d.exchangeMode || "auto");
        setForm({
          b2cMarkupPercentage: d.b2cMarkupPercentage ?? "",
          officeMarkupPercentage: d.officeMarkupPercentage ?? "",
          USD: d.exchangeRates?.USD ?? "",
          EUR: d.exchangeRates?.EUR ?? "",
          RUB: d.exchangeRates?.RUB ?? "",
          GBP: d.exchangeRates?.GBP ?? "",
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

  const isValidMarkup = useMemo(
    () =>
      form.b2cMarkupPercentage !== "" &&
      form.officeMarkupPercentage !== "",
    [form.b2cMarkupPercentage, form.officeMarkupPercentage]
  );

  const isValidRates = useMemo(() => {
    if (ratesMode === "auto") return true;
    // manual — all required
    return (
      form.USD !== "" &&
      form.EUR !== "" &&
      form.RUB !== "" &&
      form.GBP !== ""
    );
  }, [ratesMode, form]);

  // 💾 Unified save handler
  const handleSaveAll = async () => {
    if (!isValidMarkup || !isValidRates) {
      return alert("Խնդրում եմ լրացրեք բոլոր դաշտերը ճիշտ");
    }
    setLoading(true);
    try {
      const payload =
        ratesMode === "manual"
          ? {
              mode: "manual",
              rates: {
                USD: Number(form.USD),
                EUR: Number(form.EUR),
                RUB: Number(form.RUB),
                GBP: Number(form.GBP),
              },
              b2cMarkupPercentage: Number(form.b2cMarkupPercentage),
              officeMarkupPercentage: Number(form.officeMarkupPercentage),
            }
          : {
              mode: "auto",
              rates: {}, // ignored by BE
              b2cMarkupPercentage: Number(form.b2cMarkupPercentage),
              officeMarkupPercentage: Number(form.officeMarkupPercentage),
            };

      const updated = await api.post("/global-settings", payload);
      setSettings(updated);
      setRatesMode(updated.exchangeMode || "auto");
      setEditMarkup(false);
      alert("Պահպանվեց հաջողությամբ");
    } catch (err) {
      console.error("Save all failed", err);
      alert("Սխալ պահպանման ընթացքում");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 “Refresh now” — միայն Auto ռեժիմում
  const refreshNow = async () => {
    setRefreshing(true);
    try {
      const updated = await api.post("/exchange/refresh", {});
      setSettings(updated);
      // form-ի ցուցադրական թվերը թարմացնելու կարիք չկա՝ դրանք read-only են auto ռեժիմում
    } catch (err) {
      console.error("Manual refresh failed", err);
      alert("Չհաջողվեց թարմացնել CBA–ից։ Փորձեք մի քիչ հետո։");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !settings) {
    return <div className={styles.container}>Loading…</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Global Settings</h1>

      {/* Markup Settings */}
      <fieldset className={styles.fieldset}>
        <legend>Markup Settings</legend>
        {["b2cMarkupPercentage", "officeMarkupPercentage"].map((key) => (
          <div className={styles.formRow} key={key}>
            <label htmlFor={key}>
              {key === "b2cMarkupPercentage" ? "B2C Markup %" : "Office Markup %"}
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

        {/* Mode + status */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 10,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <div><b>Mode:</b> {settings.exchangeMode?.toUpperCase() || "—"}</div>
          <div><b>Source:</b> {settings.ratesSource || "—"}</div>
          <div style={{ gridColumn: "1 / -1" }}>
            <b>Last update:</b> {fmtDateTime(settings.lastRatesUpdateAt)}
          </div>
        </div>

        {/* Mode switch */}
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
          {ratesMode === "auto" && (
            <button
              type="button"
              className={styles.button}
              onClick={refreshNow}
              disabled={refreshing}
              style={{ marginLeft: 12 }}
            >
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          )}
        </div>

        {/* Rates list */}
        {["USD", "EUR", "RUB", "GBP"].map((key) => (
          <div className={styles.formRow} key={key}>
            <label htmlFor={key}>{key} Rate</label>
            {ratesMode === "manual" ? (
              <input
                id={key}
                name={key}
                type={key === "GBP" ? "number" : "number"}
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