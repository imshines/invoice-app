import React from "react";
import Head from "next/head";
import styles from "../../styles/Login.module.css";

export default function login() {
  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className={styles.formContainer}>
        <form onSubmit={(e) => e.preventDefault()} className={("container", styles.formWrapper)}>
          <h3 className="text-center">Login</h3>
          <div>
            <label for="username" className="form form-group">
              Username
            </label>
            <input placeholder="Enter Username" className="mt-3 w-100" />
          </div>
          <div>
            <label for="username" className="form form-group mt-4">
              Password
            </label>
            <input placeholder="Enter Password" type="password" className="mt-3 w-100" />
          </div>
          <div className="mt-4 d-grid gap-2">
            <button className="btn btn-primary btn-block">Login</button>
            <button className="btn btn-block">Signup</button>
          </div>
        </form>
      </div>
    </>
  );
}
