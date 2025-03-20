// "use client";
// import { useEffect, useState } from "react";
// import { useAuthStore } from "@/stores/authStore";
// import { useParams } from "next/navigation";
// import api from "@/utils/api";
// import styles from "@/styles/UserProfile.module.css";

// const UserProfile = ({ isAdminView = false }) => {
//   const { user: loggedInUser, isAuthenticated, checkAuth } = useAuthStore();
//   const { id } = useParams();
//   const [profileData, setProfileData] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isChangingPassword, setIsChangingPassword] = useState(false);
//   const [passwords, setPasswords] = useState({
//     oldPassword: "",
//     newPassword: "",
//     confirmPassword: "",
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       if (isAdminView && id) {
//         try {
//           const response = await api.get(`/users/${id}`);
//           setProfileData(response);
//         } catch (error) {
//           console.error("Error fetching user:", error);
//         }
//       } else {
//         await checkAuth();
//       }
//     };
//     fetchData();
//   }, [id, isAdminView]);

//   useEffect(() => {
//     if (isAuthenticated && loggedInUser && !isAdminView) {
//       setProfileData(loggedInUser);
//     }
//   }, [isAuthenticated, loggedInUser, isAdminView]);

//   const handleFileChange = (event) => {
//     setSelectedFile(event.target.files[0]);
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) return;
//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append("avatar", selectedFile);
//     try {
//       const response = await api.patchFormData("/users/update-avatar", formData);
//       setProfileData((prev) => ({ ...prev, avatar: response.avatar }));
//       alert("Avatar updated successfully!");
//     } catch (error) {
//       alert("Failed to upload avatar.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleRemoveAvatar = async () => {
//     try {
//       await api.patch("/users/remove-avatar"); // ✅ Նոր route (առանց form-data)
//       setProfileData((prev) => ({ ...prev, avatar: "" }));
//       checkAuth(); // ✅ Թարմացնում ենք օգտատիրոջ տվյալները
//       alert("Avatar removed successfully!");
//     } catch (error) {
//       alert("Failed to remove avatar.");
//     }
//   };

//   const handleProfileUpdate = async () => {
//     try {
//       await api.patch(`/users/${profileData._id}`, profileData);
//       alert("Profile updated successfully!");
//       setIsEditing(false);
//       if (!isAdminView) checkAuth();
//     } catch (error) {
//       alert("Error updating profile");
//     }
//   };

//   const handleChangePassword = async () => {
//     if (passwords.newPassword !== passwords.confirmPassword) {
//       alert("New passwords do not match!");
//       return;
//     }
//     try {
//       await api.patch("/auth/change-password", {
//         oldPassword: passwords.oldPassword,
//         newPassword: passwords.newPassword,
//       });
//       alert("Password changed successfully!");
//       setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
//       setIsChangingPassword(false);
//     } catch (error) {
//       alert("Error changing password");
//     }
//   };

//   const handleResetPassword = async () => {
//     try {
//       await api.post("/auth/request-password-reset", { email: profileData.email });
//       alert("Password reset email sent successfully!");
//     } catch (error) {
//       alert("Error sending password reset email.");
//     }
//   };

//   if (!profileData) {
//     return <p>Loading...</p>;
//   }

//   console.log("Avatar URL:", profileData.avatar);

//   return (
//     <div className={styles.profileContainer}>
//       <h2 className={styles.title}>
//         {isAdminView ? "User Profile" : "My Profile"}
//       </h2>

//       {/* ✅ Ավատար */}
//       <div className={styles.avatarSection}>
//         <img
//           src={
//             profileData.avatar?.startsWith("/uploads")
//               ? `http://localhost:5000${profileData.avatar}`
//               : profileData.avatar || "/default-avatar.png"
//           }
//           alt="User Avatar"
//           className={styles.avatar}
//         />
//         {profileData && loggedInUser && (isAdminView || profileData._id === loggedInUser._id) && isEditing && (
//           <div className={styles.avatarControls}>
//             <input type="file" onChange={handleFileChange} />
//             <button onClick={handleUpload} disabled={isUploading}>
//               Upload
//             </button>
//             <button onClick={handleRemoveAvatar}>Remove</button>
//           </div>
//         )}
//       </div>

//       {/* ✅ Հիմնական տվյալներ */}
//       <div className={styles.profileDetails}>
//         {isEditing ? (
//           <>
//             <div className={styles.infoGroup}>
//               <label>First Name</label>
//               <input
//                 type="text"
//                 value={profileData.firstName}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, firstName: e.target.value })
//                 }
//               />
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Last Name</label>
//               <input
//                 type="text"
//                 value={profileData.lastName}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, lastName: e.target.value })
//                 }
//               />
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Email</label>
//               <input
//                 type="email"
//                 value={profileData.email}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, email: e.target.value })
//                 }
//               />
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Phone</label>
//               <input
//                 type="text"
//                 value={profileData.phone || ""}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, phone: e.target.value })
//                 }
//               />
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Address</label>
//               <input
//                 type="text"
//                 value={profileData.address || ""}
//                 onChange={(e) =>
//                   setProfileData({ ...profileData, address: e.target.value })
//                 }
//               />
//             </div>
//             {profileData.role.includes("b2b") && (
//               <div className={styles.infoGroup}>
//                 <label>Company Name</label>
//                 <input
//                   type="text"
//                   value={profileData.companyName || ""}
//                   onChange={(e) =>
//                     setProfileData({
//                       ...profileData,
//                       companyName: e.target.value,
//                     })
//                   }
//                 />
//               </div>
//             )}
//             <div className={styles.buttonGroup}>
//               <button onClick={handleProfileUpdate}>Save</button>
//               <button
//                 className={styles.cancelButton}
//                 onClick={() => setIsEditing(false)}
//               >
//                 Cancel
//               </button>
//             </div>
//           </>
//         ) : (
//           <>
//             <div className={styles.infoGroup}>
//               <label>First Name:</label> <span>{profileData.firstName}</span>
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Last Name:</label> <span>{profileData.lastName}</span>
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Email:</label> <span>{profileData.email}</span>
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Phone:</label>{" "}
//               <span>{profileData.phone || "Not provided"}</span>
//             </div>
//             <div className={styles.infoGroup}>
//               <label>Address:</label>{" "}
//               <span>{profileData.address || "Not provided"}</span>
//             </div>
//             {profileData.role.includes("b2b") && (
//               <div className={styles.infoGroup}>
//                 <label>Company Name:</label>{" "}
//                 <span>{profileData.companyName || "Not provided"}</span>
//               </div>
//             )}
//             {(isAdminView || profileData._id === loggedInUser._id) && (
//               <button onClick={() => setIsEditing(true)}>Edit Profile</button>
//             )}
//           </>
//         )}
//       </div>

//       {/* ✅ Եթե օգտատերը իր պրոֆիլն է դիտում, ապա Change Password-ը ցուցադրում ենք */}
//       {!isAdminView && (
//         <div className={styles.passwordSection}>
//           <h3>Change Password</h3>
//           {isChangingPassword ? (
//             <>
//               <div className={styles.passwordGroup}>
//                 <label>Old Password</label>
//                 <input
//                   type="password"
//                   placeholder="Old Password"
//                   value={passwords.oldPassword}
//                   onChange={(e) =>
//                     setPasswords({ ...passwords, oldPassword: e.target.value })
//                   }
//                 />
//               </div>

//               <div className={styles.passwordGroup}>
//                 <label>New Password</label>
//                 <input
//                   type="password"
//                   placeholder="New Password"
//                   value={passwords.newPassword}
//                   onChange={(e) =>
//                     setPasswords({ ...passwords, newPassword: e.target.value })
//                   }
//                 />
//               </div>

//               <div className={styles.passwordGroup}>
//                 <label>Confirm New Password</label>
//                 <input
//                   type="password"
//                   placeholder="Confirm New Password"
//                   value={passwords.confirmPassword}
//                   onChange={(e) =>
//                     setPasswords({
//                       ...passwords,
//                       confirmPassword: e.target.value,
//                     })
//                   }
//                 />
//               </div>

//               <div className={styles.passwordButtonGroup}>
//                 <button onClick={handleChangePassword}>Update Password</button>
//                 <button
//                   className={styles.cancelButton}
//                   onClick={() => setIsChangingPassword(false)}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </>
//           ) : (
//             <button onClick={() => setIsChangingPassword(true)}>
//               Change Password
//             </button>
//           )}
//         </div>
//       )}

//       {/* ✅ Admin-ի գործողությունները */}
//       {isAdminView ? (
//         <div className={styles.passwordSection}>
//           <h3>Admin Actions</h3>
//           <button onClick={handleResetPassword}>Reset Password</button>
//         </div>
//       ) : null}
//     </div>
//   );
// };

// export default UserProfile;

"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import styles from "@/styles/UserProfile.module.css";

const UserProfile = ({ isAdminView = false }) => {
  const { user: loggedInUser, isAuthenticated, checkAuth } = useAuthStore();
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /** ✅ 1. Ստուգում է user-ի տվյալները միայն անհրաժեշտության դեպքում */
  useEffect(() => {
    const fetchData = async () => {
      if (isAdminView && id && !profileData) {
        // ✅ Վերաբեռնում է միայն եթե admin է և profileData չկա
        try {
          const response = await api.get(`/users/${id}`);
          setProfileData(response); // ✅ Տվյալները set անում ենք միայն սկզբնական բեռնումից
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      } else if (!isAdminView && !profileData) {
        await checkAuth();
      }
    };
    fetchData();
  }, [id, isAdminView]);

  /** ✅ 2. profileData-ն ստուգում է միայն անհրաժեշտության դեպքում */
  useEffect(() => {
    if (isAuthenticated && loggedInUser && !isAdminView && !profileData) {
      setProfileData(loggedInUser);
    }
  }, [isAuthenticated, loggedInUser, isAdminView]);

  /** ✅ 3. Վերբեռնում է ֆայլը */
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  /** ✅ 3. Պահպանում ենք Admin-ի կողմից լրացված դաշտերը */
  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value, // ✅ Թարմացնում ենք կոնկրետ դաշտը
    }));
  };

  /** ✅ 4. Բեռնման ֆունկցիան չի փոխվում ամեն ռենդեռի ժամանակ */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", selectedFile);
    try {
      const response = await api.patchFormData(
        "/users/update-avatar",
        formData
      );
      setProfileData((prev) => ({ ...prev, avatar: response.avatar }));
      alert("Avatar updated successfully!");
    } catch (error) {
      alert("Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile]);

  /** ✅ 5. Ջնջում է avatar-ը */
  const handleRemoveAvatar = useCallback(async () => {
    try {
      await api.patch("/users/remove-avatar");
      setProfileData((prev) => ({ ...prev, avatar: "" }));
      checkAuth();
      alert("Avatar removed successfully!");
    } catch (error) {
      alert("Failed to remove avatar.");
    }
  }, [checkAuth]);

  /** ✅ 6. Թարմացնում է user-ի տվյալները */
  const handleProfileUpdate = async () => {
    try {
      const url =
        isAdminView && profileData._id !== loggedInUser._id
          ? `/users/${profileData._id}` // 🔹 Admin-ը փոփոխում է այլ user-ի տվյալները
          : "/auth/profile"; // 🔹 User-ը փոփոխում է իր սեփական տվյալները

      const response = await api.patch(url, profileData);

      alert("Profile updated successfully!");
      setIsEditing(false);

      if (isAdminView) {
        setProfileData(response.user); // ✅ Թարմացնում ենք state-ը, որ input field-երը չդատարկվեն։
      } else {
        checkAuth(); // ✅ User-ը փոփոխելիս նորից բեռնում ենք իր տվյալները։
      }
    } catch (error) {
      alert("Error updating profile");
    }
  };

  /** ✅ 7. Փոխում է գաղտնաբառը */
  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      await api.patch("/auth/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      alert("Password changed successfully!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
    } catch (error) {
      alert("Error changing password.");
    }
  };

  /** ✅ 8. Ուղարկում է reset password email */
  const handleResetPassword = async () => {
    try {
      await api.post("/auth/request-password-reset", {
        email: profileData.email,
      });
      alert("Password reset email sent successfully!");
    } catch (error) {
      alert("Error sending password reset email.");
    }
  };

  /** ✅ 9. Օգտագործում ենք `useMemo()` avatar-ի URL-ը չկրկնելու համար */
  const avatarUrl = useMemo(() => {
    if (!profileData?.avatar) return "/default-avatar.png";
    return profileData.avatar.startsWith("/uploads")
      ? `http://localhost:5000${profileData.avatar}`
      : profileData.avatar;
  }, [profileData?.avatar]);

  /** ✅ 10. Եթե profileData չկա, վերադարձնում ենք `Loading...` */
  if (!profileData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.title}>
        {isAdminView ? "User Profile" : "My Profile"}
      </h2>

      {/* ✅ Ավատար */}
      <div className={styles.avatarSection}>
        <img
          src={
            profileData.avatar?.startsWith("/uploads")
              ? `http://localhost:5000${profileData.avatar}`
              : profileData.avatar || "/default-avatar.png"
          }
          alt="User Avatar"
          className={styles.avatar}
        />
        {profileData &&
          loggedInUser &&
          (isAdminView || profileData._id === loggedInUser._id) &&
          isEditing && (
            <div className={styles.avatarControls}>
              <input type="file" onChange={handleFileChange} />
              <button onClick={handleUpload} disabled={isUploading}>
                Upload
              </button>
              <button onClick={handleRemoveAvatar}>Remove</button>
            </div>
          )}
      </div>

      {/* ✅ Հիմնական տվյալներ */}
      {/* ✅ User-ի ամբողջական տվյալները View ռեժիմում */}
      <div className={styles.profileDetails}>
        {isEditing ? (
          <>
            <div className={styles.infoGroup}>
              <label>First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div className={styles.infoGroup}>
              <label>Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
            <div className={styles.infoGroup}>
              <label>Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div className={styles.infoGroup}>
              <label>Phone</label>
              <input
                type="text"
                value={profileData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className={styles.infoGroup}>
              <label>Address</label>
              <input
                type="text"
                value={profileData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
            {profileData.role.includes("b2b") && (
              <div className={styles.infoGroup}>
                <label>Company Name</label>
                <input
                  type="text"
                  value={profileData.companyName || ""}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                />
              </div>
            )}
            {profileData.role === "b2b_sales_partner" &&
              ["admin", "finance_user"].includes(loggedInUser.role) && (
                <div className={styles.infoGroup}>
                  <label>Balance</label>
                  <input
                    type="number"
                    value={profileData.balance || ""}
                    onChange={(e) =>
                      handleInputChange("balance", e.target.value)
                    }
                  />
                </div>
              )}
            {isAdminView && (
              <>
                <div className={styles.infoGroup}>
                  <label>Role:</label> <span>{profileData.role}</span>
                </div>
            {profileData.role === "b2b_sales_partner" &&
              ["admin", "finance_user"].includes(loggedInUser.role) && (
                <div className={styles.infoGroup}>
                  <label>Markup Percentage</label>
                  <input
                    type="number"
                    value={profileData.markupPercentage || ""}
                    onChange={(e) =>
                      handleInputChange("markupPercentage", e.target.value)
                    }
                  />
                </div>
              )}
              </>
            )}
            <div className={styles.buttonGroup}>
              <button onClick={handleProfileUpdate}>Save</button>
              <button
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.infoGroup}>
              <label>First Name:</label> <span>{profileData.firstName}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>Last Name:</label> <span>{profileData.lastName}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>Email:</label> <span>{profileData.email}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>Phone:</label>{" "}
              <span>{profileData.phone || "Not provided"}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>Address:</label>{" "}
              <span>{profileData.address || "Not provided"}</span>
            </div>

            {profileData.role.includes("b2b") && (
              <div className={styles.infoGroup}>
                <label>Company Name:</label>{" "}
                <span>{profileData.companyName || "Not provided"}</span>
              </div>
            )}
            {profileData.role.includes("b2b_sales_partner") && (
              <div className={styles.infoGroup}>
                <label>Balance:</label>{" "}
                <span>${profileData.balance || "0.00"}</span>
              </div>
            )}
            {isAdminView && (
              <>
                <div className={styles.infoGroup}>
                  <label>Role:</label> <span>{profileData.role}</span>
                </div>
                {profileData.role.includes("b2b_sales_partner") && (
                  <div className={styles.infoGroup}>
                    <label>Markup Percentage:</label>{" "}
                    <span>{profileData.markupPercentage || "0.00"}%</span>
                  </div>
                )}
              </>
            )}
            {(isAdminView || profileData._id === loggedInUser._id) && (
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
          </>
        )}
      </div>

      {/* ✅ Գաղտնաբառի փոփոխման UI */}
      {!isAdminView && (
        <div className={styles.passwordSection}>
          <h3>Change Password</h3>
          {isChangingPassword ? (
            <>
              <div className={styles.passwordGroup}>
                <label>Old Password</label>
                <input
                  type="password"
                  placeholder="Old Password"
                  value={passwords.oldPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, oldPassword: e.target.value })
                  }
                />
              </div>

              <div className={styles.passwordGroup}>
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="New Password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                />
              </div>

              <div className={styles.passwordGroup}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className={styles.passwordButtonGroup}>
                <button onClick={handleChangePassword}>Update Password</button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setIsChangingPassword(true)}>
              Change Password
            </button>
          )}
        </div>
      )}

      {/* ✅ Admin-ի գործողությունները */}
      {isAdminView && (
        <div className={styles.passwordSection}>
          <h3>Admin Actions</h3>
          <button onClick={handleResetPassword}>Reset Password</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
