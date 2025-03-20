"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/utils/api";
import UserProfile from "@/components/admin/UserProfile";

const UserProfilePage = () => {
  const params = useParams(); // ✅ Ստանում ենք URL-ից `id`
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const userId = params?.id; // ✅ Վերցնում ենք `id`, բայց ապահով կերպով

  useEffect(() => {
    if (!userId) return;
    
    const fetchUser = async () => {
      try {
        console.log("Fetching:", `/users/${userId}`);
        const response = await api.get(`/users/${userId}`);
        setUserData(response);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/admin/users"); // ✅ Եթե user չկա, վերադարձնում ենք users list
      }
    };
    
    fetchUser();
  }, [userId, router]);

  if (!userData) {
    return <p>Loading user data...</p>;
  }

  return <UserProfile user={userData} isAdminView={true} />;
};

export default UserProfilePage;