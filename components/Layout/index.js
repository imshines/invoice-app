import { ToggleProvider } from "../../context/toggleContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children, sideItems }) {
  return (
    <div>
      <ToggleProvider>
        <Header />
        <div className="d-flex">
          <Sidebar sideItems={sideItems} />
          <div className="container-fluid bg-light">{children}</div>
        </div>
      </ToggleProvider>
    </div>
  );
}
