import Head from "next/head";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";
export default function Dashboard() {
  const [toggle, setToggle] = useState(false);
  return (
    <div>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div>
        <Sidebar toggle={toggle} />
        <div className={styles.container} style={{ marginLeft: toggle ? "0px" : "200px" }}>
          <span onClick={() => setToggle(!toggle)} style={{ fontSize: 25 }}>
            =
          </span>
          <div>
            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Repellendus doloremque
            voluptates nemo vero totam, omnis similique ipsa. Distinctio consequatur dolor dolores
            voluptates! Accusamus ipsum, ullam minus id perferendis dolore delectus. Velit, ut ullam
            deleniti laboriosam maxime unde, ducimus molestiae omnis rerum vero maiores iusto
            cupiditate. Itaque aperiam quo placeat commodi, facilis quaerat amet aut ex dolor quidem
            cupiditate, eveniet harum. Vel, modi.
          </div>
        </div>
      </div>
    </div>
  );
}
