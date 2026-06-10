import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onTablesChange, updateTableStatus } from "../models/tableModel";
import { onMenuItemsChange } from "../models/menuModel";
import { onCategoriesChange } from "../models/menuCategoryModel";
import {
  onActiveOrdersChange, createOrder, completeOrder, updateOrderStatus, updateOrder
} from "../models/orderModel";
import { createReservation } from "../models/reservationModel";
import { getAllCustomers, createCustomer, getCustomerByPhone, incrementCustomerStats, updateCustomer } from "../models/customerModel";
import { showToast } from "../helpers/toast";
import { formatCurrency } from "../helpers/formatters";

// We use the same serverTimestamp from firebase to update manually if needed, but the models handle it.
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function Pos({ user }) {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'newOrder' | 'bill' | 'changeTable' | 'customItem'
  const [modalData, setModalData] = useState({});
  const [autocompleteMatches, setAutocompleteMatches] = useState([]);

  // Load Customers once for New Order autocomplete
  useEffect(() => {
    getAllCustomers().then(data => setCustomers(data)).catch(console.error);
  }, []);

  useEffect(() => {
    // Real-time listeners
    const unsubTables = onTablesChange((data) => setTables(data));
    const unsubOrders = onActiveOrdersChange((data) => setActiveOrders(data));
    const unsubCats = onCategoriesChange((data) => setCategories(data));
    const unsubMenu = onMenuItemsChange((data) => setMenuItems(data));

    return () => {
      if (unsubTables) unsubTables();
      if (unsubOrders) unsubOrders();
      if (unsubCats) unsubCats();
      if (unsubMenu) unsubMenu();
    };
  }, []);

  const filteredItems = () => {
    let items = menuItems;
    if (activeCategoryId) {
      items = items.filter((i) => i.categoryId === activeCategoryId);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
    setAutocompleteMatches([]);
  };

  // ── POS Logic: Adding Items ────────────────────────────────────
  const handleAddToOrder = async (item) => {
    let targetOrderId = selectedOrderId;
    if (!targetOrderId) {
      if (activeOrders.length === 0) return showToast("No active order. Create one first.", "warning");
      if (activeOrders.length === 1) targetOrderId = activeOrders[0].id;
      else return showToast("Multiple active orders. Click an order to select it.", "info");
    }

    const order = activeOrders.find((o) => o.id === targetOrderId);
    if (!order) return;

    try {
      const existingItems = [...(order.items || [])];
      const idx = existingItems.findIndex((ei) => ei.menuItemId === item.id);
      if (idx >= 0) {
        existingItems[idx].qty += 1;
      } else {
        existingItems.push({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          notes: "",
        });
      }

      const subtotal = existingItems.reduce((s, i) => s + i.price * i.qty, 0);
      const tax = Math.round(subtotal * 0.16); // 16% tax
      const total = subtotal + tax;

      await updateDoc(doc(db, "orders", targetOrderId), {
        items: existingItems, subtotal, tax, total, updatedAt: serverTimestamp(),
      });
      showToast(`Added ${item.name}`, "success", 1500);
    } catch (err) {
      console.error(err);
      showToast("Failed to add item.", "error");
    }
  };

  const handleRemoveItem = async (order, itemIndex) => {
    try {
      const existingItems = [...(order.items || [])];
      if (itemIndex < 0 || itemIndex >= existingItems.length) return;
      const removedName = existingItems[itemIndex].name;
      existingItems.splice(itemIndex, 1);

      const subtotal = existingItems.reduce((s, i) => s + i.price * i.qty, 0);
      const tax = Math.round(subtotal * 0.16);
      const total = subtotal + tax;

      await updateDoc(doc(db, "orders", order.id), {
        items: existingItems, subtotal, tax, total, updatedAt: serverTimestamp(),
      });

      showToast(`Removed ${removedName}`, "info", 1500);
      // Re-show modal with updated data
      setModalData({ ...order, items: existingItems, subtotal, tax, total });
    } catch (err) {
      console.error(err);
      showToast("Failed to remove item.", "error");
    }
  };

  // ── POS Logic: Order Actions ───────────────────────────────────
  const handleCheckout = async (order) => {
    try {
      await completeOrder(order.id, "cash");
      if (order.tableId) await updateTableStatus(order.tableId, "idle", null);
      if (order.customerId) {
        try { await incrementCustomerStats(order.customerId, order.total || 0); } catch (e) { }
      }
      closeModal();
      setSelectedOrderId(null);
      showToast(`${order.orderNumber} completed!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Checkout failed.", "error");
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`Cancel ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      await updateOrderStatus(order.id, "cancelled");
      if (order.tableId) await updateTableStatus(order.tableId, "idle", null);
      closeModal();
      setSelectedOrderId(null);
      showToast(`${order.orderNumber} cancelled.`, "warning");
    } catch (err) {
      console.error(err);
      showToast("Failed to cancel order.", "error");
    }
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

  // ── POS Logic: Tables ──────────────────────────────────────────
  const handleTableStatusChange = async (table, newStatus) => {
    try {
      const currentOrderId = newStatus === "idle" ? null : table.currentOrderId;
      await updateTableStatus(table.id, newStatus, currentOrderId);
      showToast(`${table.label} → ${newStatus}`, "success", 1500);
    } catch (err) {
      console.error(err);
      showToast("Failed to update table status.", "error");
    }
  };

  const handleTableClick = (table) => {
    if (table.tableStatus === "idle") {
      setModalData({ type: "dinein", tableId: table.id, customerName: "", customerPhone: "", customerAddress: "", notes: "", guests: "" });
      setActiveModal("newOrder");
      return;
    }
    if (table.currentOrderId) {
      const order = activeOrders.find((o) => o.id === table.currentOrderId);
      if (order) setSelectedOrderId(order.id);
      else showToast("Order not found for this table.", "warning");
    }
  };

  const handleChangeTableSubmit = async (newTableId) => {
    const order = modalData;
    const newTable = tables.find((t) => t.id === newTableId);
    if (!newTable) return showToast("Table not found.", "error");

    try {
      if (order.tableId) await updateTableStatus(order.tableId, "idle", null);
      await updateTableStatus(newTableId, "occupied", order.id);
      await updateOrder(order.id, { tableId: newTableId, tableName: newTable.label });
      closeModal();
      showToast(`Moved to ${newTable.label}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to change table.", "error");
    }
  };

  // ── POS Logic: Create Orders ───────────────────────────────────
  const handleSubmitNewOrder = async (e) => {
    e.preventDefault();
    const data = modalData;
    const tableId = data.tableId;
    let tableName = "";
    if (tableId) tableName = tables.find((t) => t.id === tableId)?.label || "";

    if (data.type === "dinein" && !tableId) return showToast("Select a table.", "warning");
    if (data.type === "reservation" && !tableId) return showToast("Select a table.", "warning");

    let customerId = data.customerId || null;
    if (!customerId && (data.customerName || data.customerPhone)) {
      try {
        if (data.customerPhone) {
          const existing = await getCustomerByPhone(data.customerPhone);
          if (existing) {
            customerId = existing.id;
            if (data.customerAddress && data.customerAddress !== existing.address) {
              await updateCustomer(customerId, { address: data.customerAddress });
            }
          }
        }
        if (!customerId) {
          customerId = await createCustomer({ name: data.customerName, phone: data.customerPhone, address: data.customerAddress || "" });
        }
      } catch (err) { console.warn(err); }
    }

    try {
      if (data.type === "reservation") {
        await createReservation({
          tableId, tableName, customerId, customerName: data.customerName, customerPhone: data.customerPhone,
          guestCount: parseInt(data.guests) || 0, reservedFor: data.reservedFor || "", notes: data.notes || "", createdBy: user?.uid || ""
        });
        await updateTableStatus(tableId, "reserved", null);
        showToast(`Table ${tableName} reserved for ${data.customerName}!`, "success");
      } else {
        const { id: orderId, orderNumber } = await createOrder({
          type: data.type, orderStatus: "pending", tableId: data.type === "dinein" ? tableId : null,
          tableName: data.type === "dinein" ? tableName : "", customerId, customerName: data.customerName,
          customerPhone: data.customerPhone, customerAddress: data.customerAddress || "", items: [],
          subtotal: 0, tax: 0, discount: 0, total: 0, paymentMethod: "", notes: data.notes || "", createdBy: user?.uid || ""
        });
        if (data.type === "dinein" && tableId) {
          await updateTableStatus(tableId, "occupied", orderId);
        }
        setSelectedOrderId(orderId);
        showToast(`${orderNumber} created!`, "success");
      }
      closeModal();
      getAllCustomers().then(setCustomers).catch(()=>{}); // Refresh customer cache
    } catch (err) {
      console.error(err);
      showToast("Failed to create. Check console.", "error");
    }
  };

  const handleAutocompleteMatch = (field, q) => {
    if (!q || q.length < 2) { setAutocompleteMatches([]); return; }
    const matches = customers.filter(c => {
      if (field === "name") return (c.name || "").toLowerCase().includes(q.toLowerCase());
      if (field === "phone") return (c.phone || "").includes(q);
      return false;
    });
    setAutocompleteMatches(matches);
  };

  const selectCustomer = (c) => {
    setModalData({ ...modalData, customerId: c.id, customerName: c.name || "", customerPhone: c.phone || "", customerAddress: c.address || "" });
    setAutocompleteMatches([]);
  };

  return (
    <div className="pos-wrapper">
      {/* ====== TOP BAR ====== */}
      <header className="pos-topbar">
        <div className="pos-topbar__brand"><i className="bi bi-shop"></i><span>Restro POS</span></div>
        <div className="pos-topbar__actions">
          <button className="pos-topbar__btn pos-topbar__btn--dinein" onClick={() => { setModalData({ type: "dinein", customerName: "", customerPhone: "" }); setActiveModal("newOrder"); }}>
            <i className="bi bi-plus-circle"></i> New Dine-In
          </button>
          <button className="pos-topbar__btn pos-topbar__btn--delivery" onClick={() => { setModalData({ type: "delivery", customerName: "", customerPhone: "", customerAddress: "" }); setActiveModal("newOrder"); }}>
            <i className="bi bi-truck"></i> New Delivery
          </button>
          <button className="pos-topbar__btn pos-topbar__btn--reserve" onClick={() => { setModalData({ type: "reservation", customerName: "", customerPhone: "" }); setActiveModal("newOrder"); }}>
            <i className="bi bi-calendar-check"></i> Reserve Table
          </button>
        </div>
        <div className="pos-topbar__right">
          <button className="pos-topbar__btn pos-topbar__btn--back" onClick={() => navigate("/dashboard")}><i className="bi bi-arrow-left"></i> Dashboard</button>
        </div>
      </header>

      {/* ====== BODY — 3 columns ====== */}
      <div className="pos-body">
        {/* LEFT: Menu items */}
        <aside className="pos-menu">
          <div className="pos-menu__header">
            <div className="pos-menu__search-wrap">
              <i className="bi bi-search"></i>
              <input type="text" className="pos-menu__search" placeholder="Search menu…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="pos-menu__cats">
            <button className={`pos-menu__cat-btn ${!activeCategoryId ? "active" : ""}`} onClick={() => setActiveCategoryId("")}>All</button>
            {categories.map((cat) => (
              <button key={cat.id} className={`pos-menu__cat-btn ${activeCategoryId === cat.id ? "active" : ""}`} onClick={() => setActiveCategoryId(cat.id)}>{cat.name}</button>
            ))}
          </div>
          <div className="pos-menu__list">
            <div className="pos-menu-item pos-menu-item--custom" onClick={() => setActiveModal("customItem")}>
              <div className="pos-menu-item__icon" style={{ background: "var(--secondary)", color: "#fff" }}><i className="bi bi-pencil-square"></i></div>
              <div className="pos-menu-item__info">
                <div className="pos-menu-item__name">Custom Item</div>
                <div className="pos-menu-item__price" style={{ color: "var(--secondary)" }}>One-off</div>
              </div>
              <button className="pos-menu-item__add" style={{ background: "var(--secondary)" }}><i className="bi bi-plus"></i></button>
            </div>
            
            {filteredItems().map((item) => (
              <div key={item.id} className="pos-menu-item" onClick={() => handleAddToOrder(item)}>
                <div className="pos-menu-item__icon"><i className="bi bi-cup-hot"></i></div>
                <div className="pos-menu-item__info">
                  <div className="pos-menu-item__name" title={item.name}>{item.name}</div>
                  <div className="pos-menu-item__price">{formatCurrency(item.price)}</div>
                </div>
                <button className="pos-menu-item__add"><i className="bi bi-plus"></i></button>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER: Tables */}
        <section className="pos-center">
          <div className="pos-center__header">
            <h6 className="pos-center__title">Tables</h6>
            <div className="pos-center__legend">
              <span className="legend-dot idle">Available</span>
              <span className="legend-dot occupied">Dining</span>
              <span className="legend-dot waiting">Waiting</span>
              <span className="legend-dot reserved">Reserved</span>
              <span className="legend-dot billing">Billing</span>
            </div>
          </div>
          <div className="pos-tables-grid">
            {tables.map((table) => {
              const statuses = ["idle", "occupied", "waiting", "reserved", "billing"];
              return (
                <div key={table.id} className={`pos-table ${table.tableStatus}`} onClick={() => handleTableClick(table)}>
                  <div className="pos-table__icon"><i className="bi bi-grid-3x3-gap"></i></div>
                  <div className="pos-table__name">{table.label}</div>
                  <div className="pos-table__status text-capitalize">{table.tableStatus}</div>
                  {table.currentOrderId && <div className="pos-table__order">Order ID</div>}
                  <div className="pos-table__capacity"><i className="bi bi-person"></i> {table.capacity}</div>
                  
                  {/* Status Dropdown (click stopPropagation required) */}
                  <select 
                    className="form-select form-select-sm mt-2" 
                    value={table.tableStatus} 
                    onClick={e => e.stopPropagation()} 
                    onChange={(e) => handleTableStatusChange(table, e.target.value)}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Active orders */}
        <aside className="pos-orders">
          <div className="pos-orders__header">
            <h6><i className="bi bi-lightning-charge me-1"></i>Active Orders</h6>
            <span className="pos-orders__badge">{activeOrders.length}</span>
          </div>
          <div className="pos-orders__list">
            {activeOrders.map((order) => {
              const isSelected = selectedOrderId === order.id;
              return (
                <div key={order.id} className={`pos-order-card ${isSelected ? "selected" : ""}`} onClick={() => setSelectedOrderId(isSelected ? null : order.id)}>
                  <div className="pos-order-card__top">
                    <span className="pos-order-card__num">{order.orderNumber}</span>
                    <span className={`pos-order-card__type ${order.type}`}>{order.type.toUpperCase()}</span>
                  </div>
                  <div className="pos-order-card__mid">
                    {order.type === "delivery" ? <><i className="bi bi-geo-alt me-1"></i>{order.customerName || "Customer"}</> : <><i className="bi bi-grid-3x3-gap me-1"></i>{order.tableName || "—"}</>}
                    · {(order.items || []).length} items
                  </div>
                  <div className="pos-order-card__bottom">
                    <span className="pos-order-card__total">{formatCurrency(order.total)}</span>
                    <span className={`pos-order-card__status ${order.orderStatus}`}>{order.orderStatus}</span>
                  </div>
                  {isSelected && (
                    <div className="pos-order-card__actions mt-2 d-flex gap-2" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => { setModalData(order); setActiveModal("bill"); }}><i className="bi bi-receipt"></i> Bill</button>
                      {order.type === "dinein" && <button className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setModalData(order); setActiveModal("changeTable"); }}><i className="bi bi-arrow-left-right"></i></button>}
                      <button className="btn btn-sm btn-outline-danger flex-fill" onClick={() => handleCancelOrder(order)}><i className="bi bi-x-circle"></i></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ====== MODALS ====== */}

      {/* Bill / Checkout Modal */}
      {activeModal === "bill" && (
        <div className="modal-overlay show">
          <div className="pos-modal">
            <div className="pos-modal__header">
              <h5>{modalData.orderNumber} — {(modalData.type || "dinein").toUpperCase()}</h5>
              <button className="pos-modal__close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="pos-modal__body">
              {modalData.tableName && <p className="mb-2"><strong>Table:</strong> {modalData.tableName}</p>}
              {modalData.customerName && <p className="mb-2"><strong>Customer:</strong> {modalData.customerName}</p>}
              <table className="pos-modal__table w-100">
                <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {(modalData.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{it.name}</td>
                      <td>{it.qty}</td>
                      <td>{formatCurrency(it.price * it.qty)}</td>
                      <td>
                        {modalData.orderStatus !== "completed" && modalData.orderStatus !== "cancelled" && (
                          <button className="btn btn-sm text-danger p-0" onClick={() => handleRemoveItem(modalData, i)}><i className="bi bi-trash"></i></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pos-modal__totals text-end mt-3">
                <div>Subtotal: {formatCurrency(modalData.subtotal || 0)}</div>
                <div>Tax: {formatCurrency(modalData.tax || 0)}</div>
                <div className="fw-bold fs-5 mt-2">Total: {formatCurrency(modalData.total || 0)}</div>
              </div>
            </div>
            <div className="pos-modal__footer">
              <button className="pos-modal__btn pos-modal__btn--cancel" onClick={closeModal}>Close</button>
              <button className="pos-modal__btn pos-modal__btn--print" onClick={() => handlePrint(modalData)}><i className="bi bi-printer me-1"></i>Print</button>
              {modalData.orderStatus !== "completed" && modalData.orderStatus !== "cancelled" && (
                <button className="pos-modal__btn pos-modal__btn--checkout" onClick={() => handleCheckout(modalData)}><i className="bi bi-check-circle me-1"></i>Checkout</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {activeModal === "newOrder" && (
        <div className="modal-overlay show">
          <div className="pos-modal" onClick={() => setAutocompleteMatches([])}>
            <div className="pos-modal__header">
              <h5>New {modalData.type}</h5>
              <button className="pos-modal__close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="pos-modal__body">
              <form onSubmit={handleSubmitNewOrder}>
                {(modalData.type === "dinein" || modalData.type === "reservation") && (
                  <div className="form-group">
                    <label>Select Table</label>
                    <select className="form-select" value={modalData.tableId || ""} onChange={e => setModalData({...modalData, tableId: e.target.value})} required>
                      <option value="">— Choose a table —</option>
                      {tables.filter(t => t.tableStatus === "idle").map(t => <option key={t.id} value={t.id}>{t.label} ({t.capacity} seats)</option>)}
                    </select>
                  </div>
                )}
                
                <div className="form-group position-relative" onClick={e => e.stopPropagation()}>
                  <label>Customer Name {modalData.type === 'dinein' && '(optional)'}</label>
                  <input type="text" className="form-control" placeholder="Full name" value={modalData.customerName} required={modalData.type !== 'dinein'} onChange={e => {
                    setModalData({...modalData, customerName: e.target.value});
                    handleAutocompleteMatch("name", e.target.value);
                  }} />
                  {autocompleteMatches.length > 0 && document.activeElement.placeholder === "Full name" && (
                    <div className="pos-autocomplete-list open" style={{ display: 'block' }}>
                      {autocompleteMatches.map(c => (
                        <button key={c.id} type="button" className="pos-ac-item" onClick={() => selectCustomer(c)}>
                          <div className="pos-ac-item__left"><span className="pos-ac-item__name">{c.name}</span></div>
                          <span className="pos-ac-item__phone">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group position-relative" onClick={e => e.stopPropagation()}>
                  <label>Phone {modalData.type === 'dinein' && '(optional)'}</label>
                  <input type="tel" className="form-control" placeholder="+923001234567" value={modalData.customerPhone} required={modalData.type !== 'dinein'} onChange={e => {
                    setModalData({...modalData, customerPhone: e.target.value});
                    handleAutocompleteMatch("phone", e.target.value);
                  }} />
                </div>

                {modalData.type === "delivery" && (
                  <div className="form-group">
                    <label>Delivery Address</label>
                    <input type="text" className="form-control" value={modalData.customerAddress} onChange={e => setModalData({...modalData, customerAddress: e.target.value})} required />
                  </div>
                )}

                {modalData.type === "reservation" && (
                  <>
                    <div className="form-group">
                      <label>Guest Count</label>
                      <input type="number" className="form-control" value={modalData.guests} onChange={e => setModalData({...modalData, guests: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Reserved For</label>
                      <input type="datetime-local" className="form-control" value={modalData.reservedFor} onChange={e => setModalData({...modalData, reservedFor: e.target.value})} required />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" className="form-control" placeholder="Special instructions" value={modalData.notes} onChange={e => setModalData({...modalData, notes: e.target.value})} />
                </div>

                <div className="pos-modal__footer px-0 pb-0 border-0 mt-4">
                  <button type="button" className="pos-modal__btn pos-modal__btn--cancel" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="pos-modal__btn pos-modal__btn--checkout">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Table Modal */}
      {activeModal === "changeTable" && (
        <div className="modal-overlay show">
          <div className="pos-modal">
            <div className="pos-modal__header">
              <h5>Change Table</h5>
              <button className="pos-modal__close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="pos-modal__body">
              <p>Current: <strong>{modalData.tableName || "—"}</strong></p>
              <div className="form-group mt-3">
                <label>Move to</label>
                <select className="form-select" id="newTableSelect" required>
                  <option value="">— Select available table —</option>
                  {tables.filter(t => t.tableStatus === "idle").map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="pos-modal__footer">
              <button className="pos-modal__btn pos-modal__btn--cancel" onClick={closeModal}>Cancel</button>
              <button className="pos-modal__btn pos-modal__btn--checkout" onClick={() => handleChangeTableSubmit(document.getElementById('newTableSelect').value)}><i className="bi bi-arrow-left-right me-1"></i>Move</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {activeModal === "customItem" && (
        <div className="modal-overlay show">
          <div className="pos-modal">
            <div className="pos-modal__header">
              <h5>Add Custom Item</h5>
              <button className="pos-modal__close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="pos-modal__body">
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" className="form-control" id="ciName" placeholder="e.g. Extra Sauce" required />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input type="number" className="form-control" id="ciPrice" placeholder="0" min="0" required />
              </div>
            </div>
            <div className="pos-modal__footer">
              <button className="pos-modal__btn pos-modal__btn--cancel" onClick={closeModal}>Cancel</button>
              <button className="pos-modal__btn pos-modal__btn--checkout" onClick={() => {
                const name = document.getElementById("ciName").value;
                const price = parseFloat(document.getElementById("ciPrice").value) || 0;
                if(name) { handleAddToOrder({ id: "custom_" + Date.now(), name, price }); closeModal(); }
              }}><i className="bi bi-plus-circle me-1"></i>Add</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
