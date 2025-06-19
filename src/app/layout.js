"use client";
import { useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import "../styles/globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { SidebarProvider, SidebarContext } from "../context/SidebarContext";
import "bootstrap/dist/css/bootstrap.min.css";


export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Ստանում ենք ընթացիկ URL-ը
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth(); // ✅ Backend-ից auth ստուգում
  
      // Եթե user-ը login չի եղել, տանում ենք /welcome
      if (!isAuthenticated && !pathname.startsWith("/reset-password")) {
        router.push("/welcome");
      } else if (isAuthenticated && pathname === "/") {
        router.push("/dashboard"); // ✅ Եթե login եղած է, տանում է Dashboard
      }
    };
  
    checkAuthentication();
  }, [isAuthenticated, pathname, router]);

  return (
    <html lang="en">
      <body>
        <SidebarProvider>
          <SidebarContextWrapper>
            <Navbar />
            <Sidebar />
            <MainContent>{children}</MainContent>
          </SidebarContextWrapper>
        </SidebarProvider>
      </body>
    </html>
  );
}

function SidebarContextWrapper({ children }) {
  const { isSidebarOpen } = useContext(SidebarContext);
  return (
    <div style={{ marginLeft: isSidebarOpen ? "250px" : "60px", transition: "margin-left 0.3s ease" }}>
      {children}
    </div>
  );
}

function MainContent({ children }) {
  return <div style={{ padding: "80px 20px 20px 20px" }}>{children}</div>;
}