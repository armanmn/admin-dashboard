import styles from "../styles/page.module.css";

export default function DashboardHome() {
  return (
    <div className={styles.dashboardContainer}>
      <h1>Welcome to Admin Dashboard</h1>
      <p>This is the main dashboard overview.</p>

      {/* Dashboard Widgets */}
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
          <h3>Revenue</h3>
          <p>$12,345</p>
        </div>
      </div>
    </div>
  );
}