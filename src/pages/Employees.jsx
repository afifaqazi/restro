import { useState, useEffect } from "react";
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee } from "../models/employeeModel";
import { showToast } from "../helpers/toast";

export default function Employees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", type: "waiter", customType: "", salary: "", joiningDate: "", resigningDate: "", notes: ""
  });

  const isAdmin = user?.type === "admin";

  const loadEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load employees", "error");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (e.name || "").toLowerCase().includes(q) ||
                    (e.phone || "").toLowerCase().includes(q) ||
                    (e.email || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (typeFilter && e.type !== typeFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const dataToSave = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      type: formData.type,
      customType: formData.customType.trim(),
      salary: formData.salary,
      joiningDate: formData.joiningDate || null,
      resigningDate: formData.resigningDate || null,
      notes: formData.notes.trim()
    };
    if (!dataToSave.name) { showToast("Name is required", "error"); return; }

    try {
      if (editingId) {
        await updateEmployee(editingId, dataToSave);
        showToast("Employee updated", "success");
      } else {
        await createEmployee(dataToSave);
        showToast("Employee created", "success");
      }
      setShowModal(false);
      loadEmployees();
    } catch (err) {
      console.error(err);
      showToast("Failed to save employee", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this employee?")) return;
    try {
      await deleteEmployee(id);
      showToast("Employee deleted", "success");
      loadEmployees();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const openModal = (emp = null) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        name: emp.name || "", phone: emp.phone || "", email: emp.email || "",
        type: emp.type || "waiter", customType: emp.customType || "",
        salary: emp.salary || "", 
        joiningDate: emp.joiningDate?.toDate ? emp.joiningDate.toDate().toISOString().split('T')[0] : "",
        resigningDate: emp.resigningDate?.toDate ? emp.resigningDate.toDate().toISOString().split('T')[0] : "", 
        notes: emp.notes || ""
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", email: "", type: "waiter", customType: "", salary: "", joiningDate: "", resigningDate: "", notes: "" });
    }
    setShowModal(true);
  };

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">Employees</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => openModal()}>
            <i className="bi bi-plus-lg"></i> Add Employee
          </button>
        </div>
      </div>
      
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search by name, phone, email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="manage-filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="manager">Manager</option>
          <option value="chef">Chef</option>
          <option value="waiter">Waiter</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr><td colSpan="5" className="empty-state"><p>No employees found.</p></td></tr>
            ) : (
              filteredEmployees.map(e => (
                <tr key={e.id}>
                  <td className="fw-bold">{e.name}</td>
                  <td className="text-capitalize">{e.type === 'custom' ? e.customType : e.type}</td>
                  <td>
                    {e.phone && <div><i className="bi bi-telephone text-muted me-1"></i>{e.phone}</div>}
                    {e.email && <div><i className="bi bi-envelope text-muted me-1"></i>{e.email}</div>}
                  </td>
                  <td><span className={`badge bg-${e.resigningDate ? 'secondary' : 'success'}`}>{e.resigningDate ? 'Resigned' : 'Active'}</span></td>
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
          <div className="modal-box wide">
            <div className="modal-header">
              <h5>{editingId ? "Edit Employee" : "Add Employee"}</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="manager">Manager</option>
                    <option value="chef">Chef</option>
                    <option value="waiter">Waiter</option>
                    <option value="custom">Custom Role...</option>
                  </select>
                </div>
              </div>
              {formData.type === "custom" && (
                <div className="form-row single">
                  <div className="form-group">
                    <label>Custom Role Title</label>
                    <input type="text" value={formData.customType} onChange={e => setFormData({ ...formData, customType: e.target.value })} placeholder="e.g. Delivery Driver" />
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salary (Monthly / Hourly)</label>
                  <input type="text" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
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
