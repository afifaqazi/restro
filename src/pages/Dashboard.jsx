import { useState, useEffect } from "react";
import { getOngoingOrderCount, getTodaysIncome, getTodaysOrders } from "../models/orderModel";
import { getTodaysExpenses } from "../models/expenseModel";
import { getUserCount } from "../models/userModel";
import { formatCurrency } from "../helpers/formatters";
import { showToast } from "../helpers/toast";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ongoingOrders: "—",
    income: "—",
    expenses: "—",
    employees: "—",
    topSeller: null,
  });
  const [loading, setLoading] = useState(true);

  const computeTopSeller = (orders) => {
    const counts = {};
    for (const order of orders) {
      const items = order.items || [];
      for (const item of items) {
        const name = item.name || "Unknown";
        counts[name] = (counts[name] || 0) + (item.qty || 1);
      }
    }

    let top = null;
    for (const [name, count] of Object.entries(counts)) {
      if (!top || count > top.count) top = { name, count };
    }
    return top;
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadStats = async () => {
      try {
        const [ongoingCount, income, expenses, employeeCount, todaysOrders] =
          await Promise.all([
            getOngoingOrderCount(),
            getTodaysIncome(),
            getTodaysExpenses(),
            getUserCount(),
            getTodaysOrders(),
          ]);

        if (isMounted) {
          setStats({
            ongoingOrders: ongoingCount,
            income: formatCurrency(income),
            expenses: formatCurrency(expenses),
            employees: employeeCount,
            topSeller: computeTopSeller(todaysOrders),
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        showToast("Could not load some stats. Check console.", "warning");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {/* Stats row */}
      <section className="stats-grid">
        {/* Ongoing Orders */}
        <div className="stat-card" id="statOrders">
          <div className="stat-card__icon primary">
            <i className="bi bi-receipt-cutoff"></i>
          </div>
          <div className="stat-card__body">
            <h6>Ongoing Orders</h6>
            <p className="stat-value">{loading ? "—" : stats.ongoingOrders}</p>
            <p className="stat-sub">active right now</p>
          </div>
        </div>

        {/* Employees */}
        <div className="stat-card" id="statEmployees">
          <div className="stat-card__icon info">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-card__body">
            <h6>Total Employees</h6>
            <p className="stat-value">{loading ? "—" : stats.employees}</p>
            <p className="stat-sub">total staff</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="stat-card" id="statExpenses">
          <div className="stat-card__icon warning">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="stat-card__body">
            <h6>Today's Expenses</h6>
            <p className="stat-value">{loading ? "—" : stats.expenses}</p>
            <p className="stat-sub">spent today</p>
          </div>
        </div>

        {/* Today's Income */}
        <div className="stat-card" id="statIncome">
          <div className="stat-card__icon success">
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="stat-card__body">
            <h6>Today's Income</h6>
            <p className="stat-value">{loading ? "—" : stats.income}</p>
            <p className="stat-sub">earned today</p>
          </div>
        </div>
      </section>

      {/* Dashboard content */}
      <section className="dashboard-content">
        <h5 className="section-title">Today's Top Seller</h5>
        <div id="topSellerArea">
          {loading ? (
            <div className="top-item-card">
              <div className="top-item-card__icon">
                <i className="bi bi-trophy"></i>
              </div>
              <div className="top-item-card__body">
                <h5>Loading…</h5>
                <p>Checking today's orders</p>
              </div>
            </div>
          ) : stats.topSeller ? (
            <div className="top-item-card">
              <div className="top-item-card__icon">
                <i className="bi bi-trophy" style={{ color: "var(--warning)" }}></i>
              </div>
              <div className="top-item-card__body">
                <h5>{stats.topSeller.name}</h5>
                <p>Sold {stats.topSeller.count} times today</p>
              </div>
            </div>
          ) : (
            <div className="top-item-card">
              <div className="top-item-card__icon">
                <i className="bi bi-trophy"></i>
              </div>
              <div className="top-item-card__body">
                <h5>No sales yet</h5>
                <p>Waiting for the first order</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
