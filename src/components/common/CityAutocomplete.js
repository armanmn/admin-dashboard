import { useState, useEffect } from "react";
import { searchCities } from "@/utils/citySearch"; // դեռ կստեղծենք

export default function CityAutocomplete({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        const res = await searchCities(query);
        setResults(res);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className="city-autocomplete">
      <input
        type="text"
        value={query}
        placeholder="Enter city"
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="autocomplete-dropdown">
          {results.map((city) => (
            <li key={city.code} onClick={() => onSelect(city)}>
              {city.label} ({city.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}