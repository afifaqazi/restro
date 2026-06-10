import { useState, useEffect } from "react";
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from "../models/expenseModel";
import { showToast } from "../helpers/toast";
import { formatCurrency } from "../helpers/formatters";

export default function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", amount: "", category: "inventory", date: "", notes: "" });

  const isAdmin = user?.type === "admin";

  const loadExpenses = async () => {
    try {
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load expenses", "error");
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const filteredExpenses = expenses.filter(e => {
    if (searchQuery && !(e.title || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter && e.category !== categoryFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const dataToSave = {
      title: formData.title.trim(),
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      date: formData.date || new Date().toISOString().split('T')[0],
      notes: formData.notes.trim()
    };
    if (!dataToSave.title || !dataToSave.amount) { showToast("Title and amount required", "error"); return; }

    try {
      if (editingId) {
        await updateExpense(editingId, dataToSave);
        showToast("Expense updated", "success");
      } else {
        await createExpense({ ...dataToSave, createdBy: user?.uid });
        showToast("Expense created", "success");
      }
      setShowModal(false);
      loadExpenses();
    } catch (err) {
      console.error(err);
      showToast("Failed to save expense", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this expense?")) return;
    try {
      await deleteExpense(id);
      showToast("Expense deleted", "success");
      loadExpenses();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const openModal = (exp = null) => {
    if (exp) {
      setEditingId(exp.id);
      let dateStr = "";
      if (exp.date) {
        dateStr = exp.date.toDate ? exp.date.toDate().toISOString().split('T')[0] : "";
      }
      setFormData({
        title: exp.title || "", amount: exp.amount || "", category: exp.category || "inventory", date: dateStr, notes: exp.notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", amount: "", category: "inventory", date: new Date().toISOString().split('T')[0], notes: "" });
    }
    setShowModal(true);
  };

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">Expenses</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => openModal()}>
            <i className="bi bi-plus-lg"></i> Add Expense
          </button>
        </div>
      </div>
      
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search by title…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="manage-filter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="inventory">Inventory</option>
          <option value="salary">Salary / Wages</option>
          <option value="bills">Utility Bills</option>
          <option value="maintenance">Maintenance</option>
          <option value="marketing">Marketing</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr><td colSpan="5" className="empty-state"><p>No expenses found.</p></td></tr>
            ) : (
              filteredExpenses.map(e => (
                <tr key={e.id}>
                  <td>{e.date?.toDate ? e.date.toDate().toLocaleDateString() : "—"}</td>
                  <td className="fw-bold">{e.title}</td>
                  <td className="text-capitalize">{e.category}</td>
                  <td className="text-danger fw-bold">{formatCurrency(e.amount)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(e)}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(e.id)}>Delete</button>}
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
              <h5>{editingId ? "Edit Expense" : "Add Expense"}</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row single">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} min="0" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="inventory">Inventory</option>
                    <option value="salary">Salary / Wages</option>
                    <option value="bills">Utility Bills</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="form-group"></div>
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
