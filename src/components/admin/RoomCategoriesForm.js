// import React from "react";

// const RoomCategoriesForm = ({ onChange }) => {
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     onChange(prev => ({ ...prev, [name]: value }));
//   };

//   return (
//     <div>
//       <h2>Room Category Info</h2>
//       <input name="name" placeholder="Սենյակի անուն" onChange={handleInputChange} />
//       <input name="type" placeholder="Տեսակ" onChange={handleInputChange} />
//       <input name="bedCount" placeholder="Մահճակալներ" type="number" onChange={handleInputChange} />
//       <input name="maxOccupancy" placeholder="Անձերի քանակ" type="number" onChange={handleInputChange} />
//       <select name="supportsChildren" onChange={handleInputChange}>
//         <option value="">Երեխաներ</option>
//         <option value="true">Աջակցում է</option>
//         <option value="false">Չի աջակցում</option>
//       </select>
//     </div>
//   );
// };

// export default RoomCategoriesForm;