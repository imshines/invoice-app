import Link from "next/link";
import styles from "../styles/components/Sidebar.module.css";

export default function Sidebar({ toggle, items }) {
  return (
    <nav className={styles.wrapper} style={{ width: toggle ? "0px" : "200px" }}>
      <ul className={styles.items}>
        {items.map((item) => (
          <Link href={item.route}>
            <li className={styles.item}>{item.menuItem}</li>
          </Link>
        ))}
      </ul>
    </nav>
  );
}
