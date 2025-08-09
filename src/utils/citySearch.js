// src/utils/citySearch.js

let cities = [];

export const loadCities = async () => {
  if (cities.length) return cities;

  const res = await fetch("/data/gogl_cities.hy.json");
  cities = await res.json();
  return cities;
};

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Zա-ֆԱ-Ֆ0-9\s]/g, "");

export const searchCities = async (query) => {
  const cityList = await loadCities();
  const normalized = normalize(query);
  return cityList.filter((city) =>
    normalize(city.label).includes(normalized)
  );
};