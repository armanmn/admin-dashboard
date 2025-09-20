// "use client";

// import React, { useEffect, useState } from "react";
// import { useAuthStore } from "@/stores/authStore";
// import api from "@/utils/api";
// import { useSearchParams } from "next/navigation";
// import styles from "@/styles/roomForm.module.css";

// const emptyVariant = {
//   view: "city",
//   mealPlan: "room_only",
//   cancellationPolicy: "nonrefundable",
//   refundableDaysBeforeCheckIn: 0,
//   refundableExactDate: null,
//   price: "",
// };

// const RoomForm = ({ mode = "create", initialData = null }) => {
//   const [formData, setFormData] = useState({
//     hotel: "",
//     baseType: "",
//     maxOccupancy: "",
//     beds: "",
//     size: "",
//     amenities: [],
//     description: "",
//     variants: [emptyVariant],
//     images: [],
//   });

//   const currentUser = useAuthStore((state) => state.user);
//   const [roomImages, setRoomImages] = useState([]);
//   const [hotels, setHotels] = useState([]);
//   const searchParams = useSearchParams();
//   const hotelIdFromQuery = searchParams?.get("hotelId");

//   useEffect(() => {
//     if (mode === "edit" && initialData) {
//       setFormData(initialData);
//     } else if (mode === "create" && hotelIdFromQuery) {
//       setFormData((prev) => ({ ...prev, hotel: hotelIdFromQuery }));
//     }
//   }, [initialData, mode, hotelIdFromQuery]);

//   useEffect(() => {
//     const fetchHotels = async () => {
//       try {
//         const endpoint =
//           currentUser?.role === "b2b_hotel_partner" ? "/hotels/my" : "/hotels";
//         const res = await api.get(endpoint);
//         setHotels(res);
//       } catch (error) {
//         console.error("❌ Failed to load hotels", error);
//       }
//     };
//     fetchHotels();
//   }, [currentUser]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleAmenitiesChange = (e) => {
//     const value = e.target.value;
//     const list = value.split(",").map((v) => v.trim());
//     setFormData((prev) => ({ ...prev, amenities: list }));
//   };

//   const handleVariantChange = (index, field, value) => {
//     setFormData((prev) => {
//       const newVariants = [...prev.variants];
//       newVariants[index] = { ...newVariants[index], [field]: value };
//       return { ...prev, variants: newVariants };
//     });
//   };

//   const addVariant = () => {
//     setFormData((prev) => ({
//       ...prev,
//       variants: [...prev.variants, emptyVariant],
//     }));
//   };

//   const removeVariant = (index) => {
//     setFormData((prev) => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index),
//     }));
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     setRoomImages(files);

//     // Preview thumbnails before upload
//     const previews = files.map((file) => ({
//       url: URL.createObjectURL(file),
//       isMain: false,
//       isPreview: true, // Flag to later ignore during backend submit
//     }));

//     setFormData((prev) => ({
//       ...prev,
//       images: [...prev.images, ...previews],
//     }));
//   };

//   const uploadImagesToCloudinary = async () => {
//     const uploaded = [];

//     for (let img of roomImages) {
//       if (!(img instanceof File)) continue;

//       const form = new FormData();
//       form.append("file", img);
//       form.append("upload_preset", "inlobby_unsigned");

//       try {
//         const res = await fetch(
//           "https://api.cloudinary.com/v1_1/dnqgubztq/image/upload",
//           { method: "POST", body: form }
//         );
//         const data = await res.json();
//         if (data.secure_url) {
//           uploaded.push({ url: data.secure_url, isMain: false });
//         } else {
//           console.error("Upload failed:", data);
//         }
//       } catch (err) {
//         console.error("Upload error:", err);
//       }
//     }

//     // Հեռացնում ենք preview պատկերները, ավելացնում ենք Cloudinary-ից ստացվածները
//     setFormData((prev) => ({
//       ...prev,
//       images: [...prev.images.filter((img) => !img.isPreview), ...uploaded],
//     }));

//     return uploaded;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const uploadedImages = await uploadImagesToCloudinary();

//       const payload = {
//         ...formData,
//         images: uploadedImages,
//         maxOccupancy: Number(formData.maxOccupancy),
//         beds: Number(formData.beds),
//         variants: formData.variants.map((v) => ({
//           ...v,
//           price: Number(v.price),
//           refundableDaysBeforeCheckIn: Number(v.refundableDaysBeforeCheckIn),
//         })),
//       };

//       const endpoint =
//         mode === "edit"
//           ? `/rooms/${initialData._id}`
//           : `/rooms/${formData.hotel}`;

//       const method = mode === "edit" ? api.put : api.post;

//       await method(endpoint, payload);
//       alert("✅ Room saved!");
//     } catch (err) {
//       console.error("❌ Failed to submit room", err);
//       alert("Failed to submit room");
//     }
//   };

//   return (
//     <form className={styles.form} onSubmit={handleSubmit}>
//       <h2>{mode === "edit" ? "Edit Room" : "Add New Room"}</h2>

//       <label>Hotel:</label>
//       {formData.hotel ? (
//         <>
//           <input
//             type="text"
//             value={
//               hotels.length > 0
//                 ? hotels.find(
//                     (h) =>
//                       h._id ===
//                       (typeof formData.hotel === "string"
//                         ? formData.hotel
//                         : formData.hotel._id)
//                   )?.name || "Unknown Hotel"
//                 : "Loading..."
//             }
//             disabled
//             className={styles.readOnlyInput}
//           />
//           <input type="hidden" name="hotel" value={formData.hotel} />
//         </>
//       ) : (
//         <select
//           name="hotel"
//           value={formData.hotel}
//           onChange={handleInputChange}
//           required
//         >
//           <option value="">-- Select Hotel --</option>
//           {hotels.map((h) => (
//             <option key={h._id} value={h._id}>
//               {h.name}
//             </option>
//           ))}
//         </select>
//       )}

//       <label>Room Type (base):</label>
//       <select
//         name="baseType"
//         value={formData.baseType}
//         onChange={handleInputChange}
//         required
//       >
//         <option value="">-- Select Room Type --</option>
//         <option value="Standard Double">Standard Double</option>
//         <option value="Deluxe Twin">Deluxe Twin</option>
//         <option value="Superior Room">Superior Room</option>
//         <option value="Family Suite">Family Suite</option>
//         <option value="King Suite">King Suite</option>
//         <option value="Presidential Suite">Presidential Suite</option>
//       </select>

//       <label>Max Occupancy:</label>
//       <input
//         name="maxOccupancy"
//         type="number"
//         value={formData.maxOccupancy}
//         onChange={handleInputChange}
//       />

//       <label>Beds:</label>
//       <input
//         name="beds"
//         type="number"
//         value={formData.beds}
//         onChange={handleInputChange}
//       />

//       <label>Size:</label>
//       <input name="size" value={formData.size} onChange={handleInputChange} />

//       <label>Amenities (comma separated):</label>
//       <input
//         name="amenities"
//         value={formData.amenities.join(", ")}
//         onChange={handleAmenitiesChange}
//       />

//       <label>Description:</label>
//       <textarea
//         name="description"
//         value={formData.description}
//         onChange={handleInputChange}
//       />

//       <h3>Room Variants</h3>
//       {formData.variants.map((variant, index) => (
//         <div key={index} className={styles.variantBox}>
//           <label>View:</label>
//           <select
//             value={variant.view}
//             onChange={(e) => handleVariantChange(index, "view", e.target.value)}
//           >
//             <option value="city">City</option>
//             <option value="garden">Garden</option>
//             <option value="sea">Sea</option>
//             <option value="mountain">Mountain</option>
//             <option value="pool">Pool</option>
//             <option value="other">Other</option>
//           </select>

//           <label>Meal Plan:</label>
//           <select
//             value={variant.mealPlan}
//             onChange={(e) =>
//               handleVariantChange(index, "mealPlan", e.target.value)
//             }
//           >
//             <option value="room_only">Room Only</option>
//             <option value="breakfast">Breakfast</option>
//             <option value="half_board">Half Board</option>
//             <option value="full_board">Full Board</option>
//             <option value="all_inclusive">All Inclusive</option>
//             <option value="ultra_all_inclusive">Ultra All Inclusive</option>
//           </select>

//           <label>Cancellation Policy:</label>
//           <select
//             value={variant.cancellationPolicy}
//             onChange={(e) =>
//               handleVariantChange(index, "cancellationPolicy", e.target.value)
//             }
//           >
//             <option value="nonrefundable">Non-Refundable</option>
//             <option value="refundable">Refundable</option>
//           </select>

//           {variant.cancellationPolicy === "refundable" && (
//             <>
//               <label>Days before check-in (for cancel):</label>
//               <input
//                 type="number"
//                 value={variant.refundableDaysBeforeCheckIn}
//                 onChange={(e) =>
//                   handleVariantChange(
//                     index,
//                     "refundableDaysBeforeCheckIn",
//                     e.target.value
//                   )
//                 }
//               />
//             </>
//           )}

//           <label>Price:</label>
//           <input
//             type="number"
//             value={variant.price}
//             onChange={(e) =>
//               handleVariantChange(index, "price", e.target.value)
//             }
//             required
//           />

//           <button
//             type="button"
//             onClick={() => removeVariant(index)}
//             className={styles.removeButton}
//           >
//             Remove Variant
//           </button>
//         </div>
//       ))}

//       <button type="button" onClick={addVariant}>
//         ➕ Add Variant
//       </button>

//       <label>Upload Room Images:</label>
//       <input type="file" multiple onChange={handleImageChange} />

//       {formData.images.length > 0 && (
//         <div className={styles.imagePreviewContainer}>
//           {formData.images.map((img, index) => (
//             <div key={index} className={styles.imageBox}>
//               <img
//                 src={img.url}
//                 alt={`room-${index}`}
//                 className={styles.previewImage}
//               />
//               <button
//                 type="button"
//                 className={styles.setMainButton}
//                 onClick={() => {
//                   const updated = formData.images.map((image, i) => ({
//                     ...image,
//                     isMain: i === index,
//                   }));
//                   setFormData((prev) => ({ ...prev, images: updated }));
//                 }}
//               >
//                 {img.isMain ? "✅ Main" : "Set as Main"}
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       <button type="submit" className={styles.submitButton}>
//         {mode === "edit" ? "Update Room" : "Add Room"}
//       </button>
//     </form>
//   );
// };

// export default RoomForm;