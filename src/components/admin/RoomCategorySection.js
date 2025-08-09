import React, { useEffect, useState } from "react";

const RoomCategorySection = ({ data, onChange }) => {
  const [formData, setFormData] = useState({
    roomType: "",
    view: "",
    description: "",
    size: "",
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    beds: [],
    images: [],
    ...data,
  });

  const bedTypes = ["Single", "Double", "Queen", "King", "Twin"];

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBedChange = (index, field, value) => {
    const updatedBeds = [...formData.beds];
    updatedBeds[index] = {
      ...updatedBeds[index],
      [field]: field === "count" ? parseInt(value) : value,
    };
    setFormData((prev) => ({ ...prev, beds: updatedBeds }));
  };

  const addBed = () => {
    setFormData((prev) => ({
      ...prev,
      beds: [...prev.beds, { type: "", count: 1 }],
    }));
  };

  const removeBed = (index) => {
    const updatedBeds = formData.beds.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, beds: updatedBeds }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  return (
    <div>
      <h3>Room Category Info</h3>

      <label>Room Type:</label>
      <input
        type="text"
        name="roomType"
        value={formData.roomType}
        onChange={handleChange}
      />

      <label>View:</label>
      <input
        type="text"
        name="view"
        value={formData.view}
        onChange={handleChange}
      />

      <label>Description:</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
      />

      <label>Room Size (m²):</label>
      <input
        type="number"
        name="size"
        value={formData.size}
        onChange={handleChange}
      />

      <label>Bedrooms:</label>
      <input
        type="number"
        name="numberOfBedrooms"
        value={formData.numberOfBedrooms}
        onChange={handleChange}
        min="1"
      />

      <label>Bathrooms:</label>
      <input
        type="number"
        name="numberOfBathrooms"
        value={formData.numberOfBathrooms}
        onChange={handleChange}
        min="1"
      />

      <h4>Beds</h4>
      {formData.beds.map((bed, index) => (
        <div key={index}>
          <select
            value={bed.type}
            onChange={(e) => handleBedChange(index, "type", e.target.value)}
          >
            <option value="">Select Bed Type</option>
            {bedTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={bed.count}
            onChange={(e) => handleBedChange(index, "count", e.target.value)}
            min="1"
          />
          <button type="button" onClick={() => removeBed(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addBed}>
        Add Bed
      </button>

      <h4>Room Images</h4>
      <input type="file" multiple onChange={handleImageUpload} />
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {formData.images.map((file, index) => (
          <div key={index}>
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${index}`}
              width="100"
              height="100"
            />
            <button type="button" onClick={() => removeImage(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomCategorySection;