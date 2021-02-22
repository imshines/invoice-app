import Head from "next/head";
import { useState } from "react";
import { Icon, Input } from "semantic-ui-react";

import Billing from "./billing";
import Users from "./users";
import Home from "./home";

import Sidebar from "../../components/Sidebar";
import styles from "../../styles/Dashboard.module.css";
export default function Dashboard() {
  const [toggle, setToggle] = useState(false);
  const sideItems = [
    { menuItem: "Home", route: "/dashboard-page/home" },
    { menuItem: "Billing", route: "/dashboard-page/billing" },
    { menuItem: "Users", route: "/dashboard-page/users" },
  ];
  return (
    <div>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className={styles.mainWrapper}>
        <div className="">
          <Sidebar toggle={toggle} items={sideItems} />
        </div>
        <div className={styles.container}>
          <Icon
            name="align justify"
            onClick={() => setToggle(!toggle)}
            size="big"
            className={styles.iconStyle}
          />
          <div className={styles.contentWrapper}>
            <Billing />
            <Users />
            <Home />
          </div>
        </div>
      </div>
    </div>
  );
}
