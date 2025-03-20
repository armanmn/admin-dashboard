"use client";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import styles from "@/styles/UsersList.module.css";

const UsersList = () => {
  const [users, setUsers] = useState([]);

  const { user: loggedInUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users");
        setUsers(response);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      alert("User deleted successfully.");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Are you sure you want to reset this user's password?"))
      return;

    try {
      await api.post("/users/admin/reset-password", { userId });
      alert("Password reset email sent successfully.");
    } catch (error) {
      alert("Error resetting password.");
    }
  };

  return (
    <div className={styles.usersContainer}>
      <h2 className={styles.title}>Users List</h2>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Avatar</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id}>
                <td>
                  <img
                    src={
                      user.avatar
                        ? `http://localhost:5000${user.avatar}`
                        : "/default-avatar.png"
                    }
                    alt="User Avatar"
                    className={styles.avatar}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                  />
                </td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.phone || "N/A"}</td>
                <td>{user.role}</td>
                <td>
                  {user.lastActiveAt ? (
                    new Date() - new Date(user.lastActiveAt) < 5 * 60 * 1000 ? (
                      <span className={styles.active}>🟢 Active</span>
                    ) : (
                      <span className={styles.inactive}>🔴 Offline</span>
                    )
                  ) : (
                    <span className={styles.inactive}>🔴 Offline</span>
                  )}
                </td>
                <td className={styles.actions}>
                {loggedInUser && ["admin", "office_user", "finance_user"].includes(loggedInUser.role) && (<button
                    className={styles.viewButton}
                    onClick={() => router.push(`/admin/users/${user._id}`)}
                  >
                    View
                  </button> )}
                  {loggedInUser && ["admin"].includes(loggedInUser.role) && (<button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(user._id)}
                  >
                    Delete
                  </button>)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;
