// // components/admin/ImageUploader.js
// import React, { useState } from "react";

// const ImageUploader = ({ images, setImages }) => {
//   const [uploading, setUploading] = useState(false);

//   const handleImageUpload = async (e) => {
//     const files = e.target.files;
//     const uploadedImages = [];

//     setUploading(true);
//     for (const file of files) {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("upload_preset", "your_upload_preset"); // replace with real preset

//       const res = await fetch(
//         "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", // replace
//         {
//           method: "POST",
//           body: formData,
//         }
//       );
//       const data = await res.json();
//       uploadedImages.push({ url: data.secure_url, isMain: false });
//     }

//     setImages((prev) => [...prev, ...uploadedImages]);
//     setUploading(false);
//   };

//   const setMainImage = (index) => {
//     const updated = images.map((img, i) => ({
//       ...img,
//       isMain: i === index,
//     }));
//     setImages(updated);
//   };

//   const removeImage = (index) => {
//     setImages(images.filter((_, i) => i !== index));
//   };

//   return (
//     <div className="mb-6">
//       <label className="block font-medium mb-2">Room Images</label>
//       <input
//         type="file"
//         multiple
//         onChange={handleImageUpload}
//         disabled={uploading}
//         className="mb-3"
//       />
//       <div className="flex gap-4 flex-wrap">
//         {images.map((img, i) => (
//           <div key={i} className="relative">
//             <img
//               src={img.url}
//               alt={`Room ${i}`}
//               className={`h-24 w-24 object-cover rounded ${
//                 img.isMain ? "ring-4 ring-green-500" : ""
//               }`}
//             />
//             <button
//               onClick={() => setMainImage(i)}
//               className="absolute top-1 left-1 bg-white px-1 text-xs rounded"
//             >
//               {img.isMain ? "Main" : "Set Main"}
//             </button>
//             <button
//               onClick={() => removeImage(i)}
//               className="absolute bottom-1 left-1 bg-red-500 text-white text-xs px-1 rounded"
//             >
//               Remove
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ImageUploader;