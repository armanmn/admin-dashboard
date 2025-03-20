"use client";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "../styles/popup.module.css";

const LanguagePopup = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const handleSelect = (language) => {
    setSelectedLanguage(language);
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-light" className={styles.dropdownButton}>
        🌍 {selectedLanguage}
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        {["English", "French", "German", "Armenian"].map((lang) => (
          <Dropdown.Item key={lang} onClick={() => handleSelect(lang)}>
            {lang}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguagePopup;