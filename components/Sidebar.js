import styles from "../styles/components/Sidebar.module.css";

export default function Sidebar({ toggle }) {
  return (
    <nav className={styles.wrapper} style={{ display: toggle ? "none" : "block" }}>
      <ul className={styles.items}>
        <li className={styles.item}>Home</li>
        <li className={styles.item}>Billing</li>
        <li className={styles.item}>Users</li>
        <li className={styles.item}>Invoices</li>
        <li className={styles.item}>Screens</li>
        <li className={styles.item}>Dashboard</li>
      </ul>
    </nav>
  );
}
