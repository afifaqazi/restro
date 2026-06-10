import { useState, useEffect } from "react";
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "../models/customerModel";
import { showToast } from "../helpers/toast";
import { formatCurrency } from "../helpers/formatters";

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", notes: "" });

  const isAdmin = user?.type === "admin";

  const loadCustomers = async () => {
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load customers", "error");
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (c.name || "").toLowerCase().includes(q) ||
                    (c.phone || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSave = async () => {
    const dataToSave = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim()
    };
    if (!dataToSave.name) { showToast("Name is required", "error"); return; }

    try {
      if (editingId) {
        await updateCustomer(editingId, dataToSave);
        showToast("Customer updated", "success");
      } else {
        await createCustomer(dataToSave);
        showToast("Customer created", "success");
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      console.error(err);
      showToast("Failed to save customer", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this customer?")) return;
    try {
      await deleteCustomer(id);
      showToast("Customer deleted", "success");
      loadCustomers();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const openModal = (cust = null) => {
    if (cust) {
      setEditingId(cust.id);
      setFormData({
        name: cust.name || "", phone: cust.phone || "", address: cust.address || "", notes: cust.notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", address: "", notes: "" });
    }
    setShowModal(true);
  };

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">Customers</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => openModal()}>
            <i className="bi bi-plus-lg"></i> Add Customer
          </button>
        </div>
      </div>
      
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search by name, phone…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan="5" className="empty-state"><p>No customers found.</p></td></tr>
            ) : (
              filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td className="fw-bold">{c.name}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.orderCount || 0}</td>
                  <td>{formatCurrency(c.totalSpent || 0)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(c)}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay show">
          <div className="modal-box">
            <div className="modal-header">
              <h5>{editingId ? "Edit Customer" : "Add Customer"}</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row single">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows="2"></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
