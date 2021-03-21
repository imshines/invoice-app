import Head from "next/head";
import { useState } from "react";
import Layout from "../../components/Layout";

export default function Dashboard() {
  return (
    <div>
      <Head>
        <title>Super Invoice</title>
      </Head>
      <Layout>
        <div className="container">
          <div className="row">
            <div className="card col mx-5 my-4 shadow-sm border-none">
              <h5 className="card-title mx-auto">Profits</h5>
              <h4 className="card-body text-success mx-auto">$10k</h4>
            </div>
            <div className="card col mx-5 my-4 shadow-sm border-none">
              <h5 className="card-title mx-auto">Budget</h5>
              <h4 className="card-body text-warning mx-auto">$10M</h4>
            </div>
            <div className="card col mx-5 my-4 shadow-sm border-none">
              <h5 className="card-title mx-auto">Expenses</h5>
              <h4 className="card-body text-danger mx-auto">$50k</h4>
            </div>
          </div>
          <div className="row"></div>
        </div>
      </Layout>
    </div>
  );
}
