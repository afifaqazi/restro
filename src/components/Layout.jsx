import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const NAV_ITEMS = [
  { label: "Main", type: "label" },
  { id: "dashboard", icon: "bi-grid-1x2-fill", label: "Dashboard", href: "/dashboard" },
  { id: "pos", icon: "bi-cart3", label: "POS", href: "/pos" },

  { label: "Management", type: "label" },
  { id: "orders", icon: "bi-receipt", label: "Order History", href: "/orders" },
  { id: "menu", icon: "bi-book", label: "Menu", href: "/menu" },
  { id: "tables", icon: "bi-grid-3x3-gap", label: "Tables", href: "/tables" },
  { id: "employees", icon: "bi-people", label: "Employees", href: "/employees" },
  { id: "expenses", icon: "bi-wallet2", label: "Expenses", href: "/expenses" },
  { id: "customers", icon: "bi-person-lines-fill", label: "Customers", href: "/customers" },

  { label: "System", type: "label" },
  { id: "settings", icon: "bi-gear", label: "Settings", href: "/settings" },
  { id: "auth", icon: "bi-shield-lock", label: "Auth Users", href: "/auth-users", adminOnly: true },
];

export default function Layout({ user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isUserAdmin = user?.type === "admin";

  const handleLogout = async () => {
    await auth.signOut();
    sessionStorage.removeItem("restro_user");
    navigate("/");
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="dashboard-wrapper">
      {/* ====== Sidebar ====== */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`} id="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">
            <i className="bi bi-shop"></i>
          </div>
          <span className="sidebar__brand-text">Restro POS</span>
        </div>
        <button
          className="sidebar__close"
          id="sidebarClose"
          aria-label="Close menu"
          onClick={closeSidebar}
        >
          <i className="bi bi-x-lg"></i>
        </button>
        <ul className="sidebar__nav">
          {NAV_ITEMS.map((item, index) => {
            if (item.adminOnly && !isUserAdmin) return null;

            if (item.type === "label") {
              return (
                <li key={index} className="sidebar__nav-label">
                  {item.label}
                </li>
              );
            }

            return (
              <li key={index} className="sidebar__nav-item">
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `sidebar__nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={closeSidebar}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "show" : ""}`}
        id="sidebarBackdrop"
        onClick={closeSidebar}
      ></div>

      {/* ====== Main ====== */}
      <main className="dashboard-main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar__left">
            <button
              className="topbar__toggle"
              id="sidebarToggle"
              aria-label="Open menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <i className="bi bi-list"></i>
            </button>
            <div className="topbar__greeting">
              <h2>Welcome, {user?.name || "User"}</h2>
              <p>Here's what's happening today.</p>
            </div>
          </div>
          <div className="topbar__right">
            <div className="topbar__avatar" title={user?.name || "User"}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <button className="topbar__logout" id="logoutBtn" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </header>

        {/* Dashboard content (Outlet for sub-pages) */}
        <Outlet />
      </main>
    </div>
  );
}
