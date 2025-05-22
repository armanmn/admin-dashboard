"use client";
import React, { useEffect, useState } from "react";
import Select from "react-select";

const CountrySelect = ({ value, onChange }) => {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetch("/data/countries.json")
      .then((res) => res.json())
      .then((data) => {
        const options = data
          .filter((c) => c.code) // միայն այն երկրները, որոնք ունեն հեռախոսային կոդ
          .map((c) => ({
            value: c.name,
            label: c.name,
            code: c.code,
            flag: c.flag,
          }));
        setCountries(options);
      });
  }, []);

  const customSingleValue = ({ data }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src={data.flag} alt={data.label} width={20} />
      <span>{data.label} ({data.code})</span>
    </div>
  );

  const customOption = (props) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div ref={innerRef} {...innerProps} style={{ padding: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <img src={data.flag} alt={data.label} width={20} />
        <span>{data.label} ({data.code})</span>
      </div>
    );
  };

  return (
    <Select
      options={countries}
      onChange={onChange}
      value={value}
      placeholder="Select Country"
      components={{ SingleValue: customSingleValue, Option: customOption }}
      styles={{
        control: (base) => ({
          ...base,
          padding: "0 6px",
          minHeight: "42px",  // կամ քո input-ների բարձրությունը
          fontSize: "14px",
          borderRadius: "6px",
        }),
        menu: (base) => ({
          ...base,
          zIndex: 100
        }),
      }}
    />
  );
};

export default CountrySelect;