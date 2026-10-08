import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";

function GuestLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default GuestLayout;