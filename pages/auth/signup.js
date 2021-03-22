import React from "react";
import Head from "next/head";
import styles from "../../styles/Login.module.css";

export default function login() {
  return (
    <>
      <Head>
        <title>Signup</title>
      </Head>
      <div className={styles.formContainer}>
        <form onSubmit={(e) => e.preventDefault()} className={("container", styles.formWrapper)}>
          <h3 className="text-center">Signup</h3>
          <div>
            <label for="username" className="form form-group">
              Username
            </label>
            <input placeholder="Enter Username" name="username" className="mt-3 w-100" />
          </div>
          <div>
            <label for="email" className="form form-group mt-4">
              Email
            </label>
            <input placeholder="Enter Email" name="email" className="mt-3 w-100" type="email" />
          </div>
          <div>
            <label for="phone" className="form form-group mt-4">
              Phone Number
            </label>
            <input
              placeholder="Enter Phone Number"
              name="phone"
              className="mt-3 w-100"
              type="email"
            />
          </div>
          <div>
            <label for="password" className="form form-group mt-4">
              Password
            </label>
            <input
              placeholder="Enter Password"
              name="password"
              type="password"
              className="mt-3 w-100"
            />
          </div>
          <div className="mt-4 d-grid gap-2">
            <button className="btn btn-primary btn-block">Signup</button>
            <p className="text-center mt-4 mb-0">
              Already have an account <button className="btn text-primary">Login</button>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}
