"use client";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "../styles/popup.module.css";

const CurrencyPopup = () => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const handleSelect = (currency) => {
    setSelectedCurrency(currency);
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-light" className={styles.dropdownButton}>
        💰 {selectedCurrency}
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        {["USD", "EUR", "AMD"].map((currency) => (
          <Dropdown.Item key={currency} onClick={() => handleSelect(currency)}>
            {currency}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default CurrencyPopup;