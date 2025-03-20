"use client";
import Link from "next/link";
import { useState, useContext } from "react";
import styles from "../styles/sidebar.module.css";
import { SidebarContext } from "../context/SidebarContext";
import { useAuthStore } from "@/stores/authStore";
import SignupModal from "./SignupModal"; // ✅ Բերում ենք մոդալը

const Sidebar = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext);
  const { user: loggedInUser } = useAuthStore();
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false); // ✅ Add User մոդալի վիճակ

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleUsersDropdown = () => {
    setIsUsersOpen(!isUsersOpen);
  };

  return (
    <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : styles.closed}`}>
      <button className={styles.toggleButton} onClick={toggleSidebar}>
        {isSidebarOpen ? "<<" : ">>"}
      </button>
      <ul className={styles.menu}>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/admin/profile">My Profile</Link></li>
        <li><Link href="/bookings">Bookings</Link></li>
        <li><Link href="/hotels">Hotels</Link></li>
        <li><Link href="/rooms">Rooms</Link></li>

        {/* ✅ Users Dropdown */}
        {loggedInUser && ["admin", "office_user", "finance_user"].includes(loggedInUser.role) && (
          <li className={styles.hasDropdown}>
            <span className={styles.dropdownToggle} onClick={toggleUsersDropdown}>
              Users {isUsersOpen ? "▲" : "▼"}
            </span>
            <ul className={`${styles.dropdown} ${isUsersOpen ? styles.open : ""}`}>
              <li><Link href="/admin/users">Users List</Link></li>
              {loggedInUser.role === "admin" && (
                <li>
                  <button className={styles.addUserButton} onClick={() => setIsAddUserOpen(true)}>
                    Add User ➕
                  </button>
                </li>
              )}
            </ul>
          </li>
        )}

        {/* ✅ Travellers բաժինը */}
        {loggedInUser && loggedInUser.role !== "b2c" && (
          <li><Link href="/admin/travellers">Travellers</Link></li>
        )}

        <li><Link href="/payments">Payments</Link></li>
        <li><Link href="/finance">Finance</Link></li>
        <li><Link href="/settings">Settings</Link></li>
      </ul>

      {/* ✅ Add User մոդալը */}
      <SignupModal show={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} isAdminView={true} />
    </div>
  );
};

export default Sidebar;