"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import styles from "@/styles/ResetPassword.module.css";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // ✅ Ստանում ենք token-ը URL-ից
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await api.post("/auth/reset-password", { token, newPassword });
      alert("Password reset successful! Redirecting to login...");
      router.push("/");
    } catch (error) {
      alert("Error resetting password.");
    }
  };

  return (
    <div className={styles.resetContainer}>
      <h2>Reset Password</h2>
      <form className={styles.resetForm}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="button" onClick={handleResetPassword}>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;