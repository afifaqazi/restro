import { useState, useEffect } from "react";
import { getAllTables, createTable, updateTable, deleteTable } from "../models/tableModel";
import { showToast } from "../helpers/toast";

export default function Tables({ user }) {
  const [tables, setTables] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ label: "", capacity: 4 });

  const isAdmin = user?.type === "admin";

  const loadTables = async () => {
    try {
      const data = await getAllTables();
      setTables(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load tables", "error");
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables = tables.filter(t => {
    if (searchQuery && !(t.label || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && t.tableStatus !== statusFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const label = formData.label.trim();
    const capacity = parseInt(formData.capacity) || 4;
    if (!label) { showToast("Label is required", "error"); return; }

    try {
      if (editingId) {
        await updateTable(editingId, { label, capacity });
        showToast("Table updated", "success");
      } else {
        await createTable({ label, capacity });
        showToast("Table created", "success");
      }
      setShowModal(false);
      loadTables();
    } catch (err) {
      console.error(err);
      showToast("Failed to save table", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this table?")) return;
    try {
      await deleteTable(id);
      showToast("Table deleted", "success");
      loadTables();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const openModal = (table = null) => {
    if (table) {
      setEditingId(table.id);
      setFormData({ label: table.label, capacity: table.capacity || 4 });
    } else {
      setEditingId(null);
      setFormData({ label: "", capacity: 4 });
    }
    setShowModal(true);
  };

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">Tables</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => openModal()}>
            <i className="bi bi-plus-lg"></i> Add Table
          </button>
        </div>
      </div>
      
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search tables…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="manage-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="idle">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTables.length === 0 ? (
              <tr><td colSpan="4" className="empty-state"><p>No tables found.</p></td></tr>
            ) : (
              filteredTables.map(t => (
                <tr key={t.id}>
                  <td className="fw-bold">{t.label}</td>
                  <td>{t.capacity}</td>
                  <td>
                    <span className={`badge bg-${t.tableStatus === 'idle' ? 'success' : t.tableStatus === 'occupied' ? 'danger' : 'warning'}`}>
                      {t.tableStatus}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(t)}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)}>Delete</button>}
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
              <h5>{editingId ? "Edit Table" : "Add Table"}</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row single">
                <div className="form-group">
                  <label>Label</label>
                  <input type="text" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="e.g. Table 1, Window 2" />
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="e.g. 4" min="1" />
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
