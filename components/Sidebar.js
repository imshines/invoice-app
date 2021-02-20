import styles from "../styles/components/Sidebar.module.css";

export default function Sidebar({ toggle, items }) {
  return (
    <nav className={styles.wrapper} style={{ display: toggle ? "none" : "block" }}>
      <ul className={styles.items}>
        {items.map((item) => (
          <li className={styles.item}>{item}</li>
        ))}
      </ul>
    </nav>
  );
}
