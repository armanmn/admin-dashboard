"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore"; // ✅ Ոչ թե default import

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to Our Platform!</h1>
      <p>Please login to access your dashboard.</p>
    </div>
  );
}