const API_URL = "http://localhost:5000/api/v1";

const api = {
  get: async (endpoint, config = {}) => {
    const url = new URL(`${API_URL}${endpoint}`);

    // ✅ Եթե params կան, ավելացնենք query string
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    console.log("🌐 Final fetch URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  },

   // get: async (endpoint) => {
  //   console.log(`Fetching: ${API_URL}${endpoint}`); // ✅ Debugging log
  //   const response = await fetch(`${API_URL}${endpoint}`, {
  //     method: "GET",
  //     credentials: "include",
  //   });

  //   // console.log(`Response Status: ${response.status}`); // ✅ Debugging log

  //   if (!response.ok) {
  //     // console.error(`API request failed: ${response.status}`, await response.text());
  //     throw new Error(`API request failed: ${response.status}`);
  //   }

  //   return await response.json();
  // },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  },

  patchFormData: async (endpoint, formData) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH", // ✅ Փոխեցինք `POST`-ից `PATCH`
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  },
};

export default api;