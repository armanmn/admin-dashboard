"use client";

import React from "react";
import styles from "@/styles/page.module.css";
import Link from "next/link";

const DashboardPage = () => {
  return (
    <div className={styles.dashboardContainer}>
      <h1>📊 Admin Dashboard</h1>
      <p className={styles.description}>
        Welcome to your control panel. Here you can manage users, bookings, hotels, payments and more.
      </p>

      {/* Widgets */}
      <div className={styles.widgetContainer}>
        <div className={`${styles.widget} ${styles.blue}`}>
          <h3>Total Bookings</h3>
          <p>123</p>
        </div>

        <div className={`${styles.widget} ${styles.green}`}>
          <h3>Total Users</h3>
          <p>56</p>
        </div>

        <div className={`${styles.widget} ${styles.orange}`}>
          <h3>Total Revenue</h3>
          <p>$12,345</p>
        </div>
      </div>

      {/* Quick Access Links */}
      <div className={styles.quickLinks}>
        <Link href="/admin/users" className={styles.linkCard}>👥 Users</Link>
        <Link href="/admin/bookings" className={styles.linkCard}>📘 Bookings</Link>
        <Link href="/admin/hotels" className={styles.linkCard}>🏨 Hotels</Link>
        <Link href="/admin/payments" className={styles.linkCard}>💳 Payments</Link>
        <Link href="/admin/settings" className={styles.linkCard}>⚙️ Settings</Link>
      </div>
    </div>
  );
};

export default DashboardPage;