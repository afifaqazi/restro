import { useState, useEffect } from "react";
import { getAllOrders, deleteOrder } from "../models/orderModel";
import { showToast } from "../helpers/toast";
import { formatCurrency } from "../helpers/formatters";

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewModalData, setViewModalData] = useState(null);

  const isAdmin = user?.type === "admin";

  const loadOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").toLowerCase().includes(q);
      if (!matchSearch) return false;
    }
    if (statusFilter && o.orderStatus !== statusFilter) return false;
    if (typeFilter && o.type !== typeFilter) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this order? It can be restored later.")) return;
    try {
      await deleteOrder(id);
      showToast("Order deleted", "success");
      loadOrders();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete order", "error");
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  };

  const handlePrint = (order) => {
    const receiptWin = window.open("", "_blank", "width=400,height=600");
    const items = order.items || [];
    const rows = items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.name}</td><td>${it.qty}</td><td>${formatCurrency(it.price * it.qty)}</td></tr>`).join("");
    
    receiptWin.document.write(`
      <!DOCTYPE html><html><head><title>Bill</title><style>
      body { font-family: monospace; font-size: 12px; padding: 10px; width: 280px; margin: auto; }
      h2 { text-align: center; margin-bottom: 4px; } hr { border: none; border-top: 1px dashed #333; }
      table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 3px 2px; }
      th:last-child, td:last-child { text-align: right; } .total { font-size: 14px; font-weight: bold; } .center { text-align: center; }
      </style></head><body>
      <h2>Restro POS</h2><p class="center">${order.orderNumber} · ${(order.type || "dinein").toUpperCase()}</p>
      ${order.tableName ? `<p>Table: ${order.tableName}</p>` : ""}
      ${order.customerName ? `<p>Customer: ${order.customerName}</p>` : ""}
      <hr/><table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Amt</th></tr></thead><tbody>${rows}</tbody></table><hr/>
      <p>Subtotal: ${formatCurrency(order.subtotal || 0)}</p><p>Tax: ${formatCurrency(order.tax || 0)}</p>
      ${order.discount ? `<p>Discount: -${formatCurrency(order.discount)}</p>` : ""}
      <p class="total">Total: ${formatCurrency(order.total || 0)}</p><hr/>
      <p class="center">Thank you for dining with us!</p><script>window.print();</script></body></html>
    `);
    receiptWin.document.close();
  };

  return (
    <>
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search by order #, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className="manage-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="manage-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="dinein">Dine-in</option>
          <option value="delivery">Delivery</option>
          <option value="takeaway">Takeaway</option>
        </select>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Type</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="empty-state"><p>Loading orders…</p></td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="8" className="empty-state"><i className="bi bi-receipt"></i><p>No orders found.</p></td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="fw-bold">{order.orderNumber}</td>
                  <td><span className="badge bg-secondary text-uppercase">{order.type}</span></td>
                  <td>{order.customerName || "—"}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td>{formatCurrency(order.total || 0)}</td>
                  <td>
                    <span className={`badge bg-${order.orderStatus === "completed" ? "success" : order.orderStatus === "cancelled" ? "danger" : "warning"}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-info me-2" onClick={() => setViewModalData(order)}>View</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(order.id)}>Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewModalData && (
        <div className="modal-overlay show">
          <div className="pos-modal" style={{ maxWidth: '400px' }}>
            <div className="pos-modal__header">
              <h5>{viewModalData.orderNumber} — {(viewModalData.type || "dinein").toUpperCase()}</h5>
              <button className="pos-modal__close" onClick={() => setViewModalData(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="pos-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {viewModalData.tableName && <p className="mb-2"><strong>Table:</strong> {viewModalData.tableName}</p>}
              {viewModalData.customerName && <p className="mb-2"><strong>Customer:</strong> {viewModalData.customerName}</p>}
              <table className="table table-sm mt-3">
                <thead><tr><th>#</th><th>Item</th><th>Qty</th><th className="text-end">Total</th></tr></thead>
                <tbody>
                  {(viewModalData.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{it.name}</td>
                      <td>{it.qty}</td>
                      <td className="text-end">{formatCurrency(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-end mt-3 border-top pt-2">
                <div>Subtotal: {formatCurrency(viewModalData.subtotal || 0)}</div>
                <div>Tax: {formatCurrency(viewModalData.tax || 0)}</div>
                <div className="fw-bold fs-5 mt-1">Total: {formatCurrency(viewModalData.total || 0)}</div>
              </div>
            </div>
            <div className="pos-modal__footer p-3">
              <button className="btn btn-secondary w-100 mb-2" onClick={() => setViewModalData(null)}>Close</button>
              <button className="btn btn-primary w-100" onClick={() => handlePrint(viewModalData)}><i className="bi bi-printer me-1"></i>Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
