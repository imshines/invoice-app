import Head from "next/head";
import styles from "../styles/Login.module.css";
import { Button, Input, Label } from "semantic-ui-react";
export default function Login() {
  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className={styles.formContainer}>
        <form onSubmit={(e) => e.preventDefault()} className={("container", styles.formWrapper)}>
          <div>
            <label for="username" className="d-block">
              Username
            </label>
            <Input placeholder="Enter Username" className="my-3" fluid />
          </div>
          <div>
            <label for="username" className="d-block">
              Password
            </label>
            <Input placeholder="Enter Password" type="password" className="my-3" fluid />
          </div>
          <Button primary fluid>
            Login
          </Button>
          <Button fluid className="mt-2">
            Signup
          </Button>
        </form>
      </div>
    </>
  );
}
