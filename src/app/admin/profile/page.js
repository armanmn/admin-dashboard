"use client";

import { useAuthStore } from "@/stores/authStore"; // ✅ Import auth store
import UserProfile from "@/components/admin/UserProfile"; // ✅ Import UserProfile

export default function ProfilePage() {
  const { user: loggedInUser, isAuthenticated } = useAuthStore(); // ✅ Ստանում ենք loggedInUser

  return (
    <div>
      <h1>My Profile</h1>
      {isAuthenticated && loggedInUser ? (

        <UserProfile user={loggedInUser} />
        
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}