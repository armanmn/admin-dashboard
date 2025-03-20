"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import styles from "@/styles/AddUser.module.css";

const AddUserPage = () => {
  const router = useRouter();

  // ✅ State for form fields
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "b2b_sales_partner", // 🔹 Default role
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Handle input changes
  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let endpoint = "";
      let payload = { ...userData };

      // ✅ Ընտրում ենք ճիշտ API-ն ըստ role-ի
      if (["b2b_sales_partner", "b2b_hotel_partner"].includes(userData.role)) {
        endpoint = "/auth/register-b2b";
      } else if (["finance_user", "office_user"].includes(userData.role)) {
        endpoint = "/users/admin/create-user";
      } else {
        alert("Invalid role selected");
        return;
      }

      // ✅ Ուղարկում ենք request-ը
      await api.post(endpoint, payload);
      alert("User added successfully!");
      router.push("/admin/users"); // ✅ Վերադարձ դեպի Users List
    } catch (error) {
      alert("Error adding user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.addUserContainer}>
      <h2>Add New User</h2>
      <form onSubmit={handleSubmit} className={styles.addUserForm}>
        <label>First Name</label>
        <input
          type="text"
          name="firstName"
          value={userData.firstName}
          onChange={handleInputChange}
          required
        />

        <label>Last Name</label>
        <input
          type="text"
          name="lastName"
          value={userData.lastName}
          onChange={handleInputChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={userData.email}
          onChange={handleInputChange}
          required
        />

        <label>Phone</label>
        <input
          type="text"
          name="phone"
          value={userData.phone}
          onChange={handleInputChange}
        />

        <label>Role</label>
        <select name="role" value={userData.role} onChange={handleInputChange}>
          <option value="b2b_sales_partner">B2B Sales Partner</option>
          <option value="b2b_hotel_partner">B2B Hotel Partner</option>
          <option value="finance_user">Finance User</option>
          <option value="office_user">Office User</option>
        </select>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
};

export default AddUserPage;