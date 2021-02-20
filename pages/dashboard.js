import Head from "next/head";
import { useState } from "react";
import { Icon, Input } from "semantic-ui-react";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";
export default function Dashboard() {
  const [toggle, setToggle] = useState(false);
  const sideItems = ["Home", "Dashboard", "Users", "Invoices", "Screens"];
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
            <form onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="Amount">Enter Amount</label>
                <Input
                  type="text"
                  placeholder="Enter Amount"
                  name="Amount"
                  style={{ marginLeft: 20 }}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
