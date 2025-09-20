import { useAuthStore } from "../stores/authStore";
import styles from "../styles/navbar.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import { SidebarContext } from "../context/SidebarContext";
import Image from "next/image";
import { useCurrencyStore } from "@/stores/currencyStore";
import CurrencySwitcher from "@/components/common/CurrencySwitcher";

export default function Navbar() {
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { isSidebarOpen } = useContext(SidebarContext);
  const { currency, initCurrency } = useCurrencyStore(); // <-- currency store
  const router = useRouter();
  const [username, setUsername] = useState("Guest");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await checkAuth();
      } catch (error) {}
    };
    checkAuthentication();
  }, []);

  // User name
  useEffect(() => {
    if (user?.firstName) {
      setUsername(user.firstName);
    }
  }, [user]);

  // Initialize default currency
  useEffect(() => {
    if (!currency) {
      initCurrency();
    }
  }, [currency, initCurrency]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleLoginSuccess = async () => {
    await checkAuth();
    setIsLoginOpen(false);
  };

  return (
    <header
      className={`${styles.navbar} ${
        isSidebarOpen ? styles.open : styles.closed
      }`}
    >
      <div className={styles.leftMenu}>
        <Image src="/logo.png" alt="Logo" width={120} height={28} />
      </div>

      <div className={styles.rightMenu}>
        {/* Currency popup now uses initialized default currency */}
        <CurrencySwitcher />
        {isAuthenticated ? (
          <div className={styles.userMenu}>
            <span className="fw-bold">👤 {username}</span>
            <button
              className="btn btn-action btn-sm ms-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.authMenu}>
            <button
              className="btn btn-action btn-sm ms-2"
              onClick={() => setIsLoginOpen(true)}
            >
              Login
            </button>
            <button
              className="btn btn-action btn-sm ms-2"
              onClick={() => setIsSignupOpen(true)}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Login & Signup Modals */}
      <LoginModal
        show={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLoginSuccess}
      />
      <SignupModal show={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </header>
  );
}