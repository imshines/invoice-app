import React from "react";
import * as Icon from "heroicons-react";
import { ToggleContext } from "../../context/toggleContext";

export default function Header() {
  const { toggleFunction } = React.useContext(ToggleContext);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          Super Invoice
        </a>
        <button className="btn btn-sm btn-outline btn-dark ms-4" onClick={toggleFunction}>
          <Icon.Menu />
        </button>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#">
                Login
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Signup
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
