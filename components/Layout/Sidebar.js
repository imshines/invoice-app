import React from "react";
import Link from "next/link";
import styles from "../../styles/components/Sidebar.module.css";
import * as Icon from "heroicons-react";
import { ToggleContext } from "../../context/toggleContext";

export default function Sidebar() {
  const sideItems = [
    { menuItem: "Dashboard", route: "/dashboard-page/", icon: <Icon.Home /> },
    { menuItem: "Billing", route: "/dashboard-page/billing", icon: <Icon.Clipboard /> },
    { menuItem: "Users", route: "/dashboard-page/users", icon: <Icon.User /> },
  ];

  const { toggle, toggleFunction } = React.useContext(ToggleContext);
  console.log(toggle, "Yes");

  return (
    <>
      {toggle ? (
        <nav className={`${styles.wrapper} bg-dark text-light`} style={{ width: "200px" }}>
          <ul className={styles.items}>
            {sideItems.map((item) => (
              <div className={styles.item} key={item.menuItem}>
                <Link href={item.route}>
                  <div className="d-flex align-items-center">
                    {item.icon}
                    <li className="ms-4">{item.menuItem}</li>
                  </div>
                </Link>
              </div>
            ))}
          </ul>
        </nav>
      ) : (
        <nav className={`${styles.wrapper} bg-dark text-light`} style={{ width: "65px" }}>
          <ul className={styles.items}>
            {sideItems.map((item) => (
              <div className={styles.item} key={item.menuItem}>
                <Link href={item.route}>
                  <div className="d-flex align-items-center">{item.icon}</div>
                </Link>
              </div>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
