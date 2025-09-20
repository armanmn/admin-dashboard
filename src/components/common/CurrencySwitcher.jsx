"use client";
import { useEffect, useMemo } from "react";
import { Dropdown } from "react-bootstrap";
import { useCurrencyStore } from "@/stores/currencyStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import menuStyles from "@/styles/currencyMenu.module.css";
import navBtn from "@/styles/navbarButtons.module.css"; // ⬅️ ԱՅՍ ՏՈՂԸ ՆՈՐՆ Է

const FALLBACKS = ["AMD", "USD", "EUR", "GBP", "RUB"];

export default function CurrencySwitcher() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const initCurrency = useCurrencyStore((s) => s.initCurrency);
  const settings = usePublicSettings();

  useEffect(() => {
    if (!currency) initCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const options = useMemo(() => {
    const fromApi =
      (settings?.availableCurrencies && Array.isArray(settings.availableCurrencies)
        ? settings.availableCurrencies
        : Object.keys(settings?.exchangeRates || {})) || [];
    return Array.from(new Set([...fromApi.map(String), ...FALLBACKS])).filter(Boolean);
  }, [settings]);

  const current = currency || settings?.defaultCurrency || "AMD";

  if (!currency && !settings) {
    return (
      <Dropdown align="end">
        <Dropdown.Toggle id="currency-switcher" variant="outline-light" className={navBtn.toggle} disabled>
          💰 Loading…
        </Dropdown.Toggle>
      </Dropdown>
    );
  }

  return (
    <Dropdown align="end">
      {/* ✅ պահում ենք սև navbar-ի ոճը, կապույտը այլևս չի լինի */}
      <Dropdown.Toggle
        id="currency-switcher"
        variant="outline-light"
        className={navBtn.toggle}
      >
        💰 {current}
      </Dropdown.Toggle>

      {/* dropdown մենյուն՝ ինչպես արդեն ունես */}
      <Dropdown.Menu className={menuStyles.menu}>
        {options.map((cur) => {
          const isActive = cur === current;
          return (
            <Dropdown.Item
              key={cur}
              onClick={() => setCurrency(cur)}
              className={`${menuStyles.item} ${isActive ? menuStyles.active : ""}`}
            >
              <span className={menuStyles.check}>{isActive ? "✓" : ""}</span>
              {cur}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}