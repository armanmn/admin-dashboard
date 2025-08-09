import React, { useState } from "react";

const RoomVariationForm = ({ onChange }) => {
  const [variations, setVariations] = useState([]);

  const addVariation = () => {
    const newVariation = {
      refundable: false,
      cancellationDays: 0,
      mealPlan: "",
      price: "",
      currency: "AMD",
    };
    const newList = [...variations, newVariation];
    setVariations(newList);
    onChange(newList);
  };

  const updateVariation = (index, field, value) => {
    const updated = [...variations];
    updated[index][field] = value;
    setVariations(updated);
    onChange(updated);
  };

  return (
    <div>
      <h2>Room Variations</h2>
      <button type="button" onClick={addVariation}>Add Variation</button>
      {variations.map((variation, i) => (
        <div key={i}>
          <select value={variation.refundable} onChange={(e) => updateVariation(i, "refundable", e.target.value === "true")}>
            <option value="false">Non-refundable</option>
            <option value="true">Refundable</option>
          </select>
          {variation.refundable && (
            <input
              type="number"
              placeholder="Free cancel before N days"
              value={variation.cancellationDays}
              onChange={(e) => updateVariation(i, "cancellationDays", e.target.value)}
            />
          )}
          <input placeholder="Meal Plan" value={variation.mealPlan} onChange={(e) => updateVariation(i, "mealPlan", e.target.value)} />
          <input placeholder="Price" type="number" value={variation.price} onChange={(e) => updateVariation(i, "price", e.target.value)} />
          <select value={variation.currency} onChange={(e) => updateVariation(i, "currency", e.target.value)}>
            <option value="AMD">AMD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default RoomVariationForm;