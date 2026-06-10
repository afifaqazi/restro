import { useState, useEffect } from "react";
import { getAllUsers, createUser, updateUser, softDeleteUser, getUserByEmail } from "../models/userModel";
import { createAuthUser, updateCurrentUserEmail, updateCurrentUserPassword, sendResetEmail } from "../models/authModel";
import { showToast } from "../helpers/toast";
import { isValidEmail, isValidPassword } from "../helpers/validators";

export default function AuthUsers({ user }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", role: "waiter", password: "" });

  const isAdmin = user?.type === "admin";

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load users", "error");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const filteredUsers = users.filter(u => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (u.name || "").toLowerCase().includes(q) ||
                    (u.email || "").toLowerCase().includes(q) ||
                    (u.phone || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter && u.type !== roleFilter) return false;
    return true;
  });

  const handleSave = async () => {
    const { name, phone, email, role, password } = formData;

    if (!name.trim()) { showToast("Name is required", "error"); return; }
    if (!email.trim() || !isValidEmail(email)) { showToast("Valid email is required", "error"); return; }

    try {
      if (editingId) {
        // Edit mode
        const target = users.find(u => u.id === editingId);
        if (!target) return;

        const isSelf = editingId === user.uid;
        const isCreator = user.createdBy === target.id;
        const update = { name: name.trim(), phone: phone.trim() };

        if (!isCreator) update.type = role;

        if (email.trim() !== target.email) {
          const existing = await getUserByEmail(email.trim());
          if (existing && existing.id !== editingId) {
            showToast("Email already in use", "error");
            return;
          }
          update.email = email.trim();
          if (isSelf) await updateCurrentUserEmail(email.trim());
        }

        if (password) {
          if (!isValidPassword(password)) { showToast("Password must be at least 6 characters", "error"); return; }
          if (isSelf) {
            await updateCurrentUserPassword(password);
          } else {
            showToast("You can only change your own password directly. Use reset email for others.", "warning");
          }
        }

        await updateUser(editingId, update);
        showToast("User updated", "success");
      } else {
        // Add mode
        if (!password || !isValidPassword(password)) { showToast("Password must be at least 6 characters", "error"); return; }
        const existing = await getUserByEmail(email.trim());
        if (existing) { showToast("Email already exists", "error"); return; }

        let uid;
        try {
          uid = await createAuthUser(email.trim(), password);
        } catch (err) {
          showToast("Failed to create auth account", "error");
          return;
        }

        await createUser({
          uid, name: name.trim(), email: email.trim(), phone: phone.trim(), type: role, createdBy: user.uid
        });
        showToast("User created successfully", "success");
      }

      setShowModal(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("Failed to save user", "error");
    }
  };

  const handleDelete = async (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    const activeCount = users.filter(u => u.status !== false).length;
    if (activeCount <= 1) { showToast("Cannot delete the last user", "error"); return; }
    if (id === user.uid) { showToast("Cannot delete your own account", "error"); return; }
    if (user.createdBy === target.id) { showToast("Cannot delete the admin who created your account", "error"); return; }

    if (!window.confirm(`Delete user "${target.name || target.email}"?`)) return;
    try {
      await softDeleteUser(id);
      showToast("User deleted", "success");
      loadUsers();
    } catch (err) {
      showToast("Failed to delete user", "error");
    }
  };

  const handleResetPassword = async () => {
    const target = users.find(u => u.id === editingId);
    if (!target || !target.email) return;
    try {
      await sendResetEmail(target.email);
      showToast(`Password reset email sent to ${target.email}`, "success");
    } catch (err) {
      showToast("Failed to send reset email", "error");
    }
  };

  const openModal = (u = null) => {
    if (u) {
      setEditingId(u.id);
      setFormData({ name: u.name || "", phone: u.phone || "", email: u.email || "", role: u.type || "waiter", password: "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", email: "", role: "waiter", password: "" });
    }
    setShowModal(true);
  };

  if (!isAdmin) return <div className="p-4 text-danger">Access Denied. Admins only.</div>;

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">All Auth Users</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => openModal()}>
            <i className="bi bi-plus-lg"></i> Add User
          </button>
        </div>
      </div>
      
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search by name, email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="manage-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="waiter">Waiter</option>
        </select>
      </div>

      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="empty-state"><p>No users found.</p></td></tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  <td className="fw-bold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td className="text-capitalize"><span className={`badge bg-${u.type === 'admin' ? 'danger' : u.type === 'manager' ? 'primary' : 'info'}`}>{u.type}</span></td>
                  <td><span className={`badge bg-${u.status !== false ? 'success' : 'secondary'}`}>{u.status !== false ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(u)}>Edit</button>
                    {u.id !== user.uid && <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>Delete</button>}
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
              <h5>{editingId ? "Edit User" : "Add User"}</h5>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                {editingId && (
                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button type="button" className="btn btn-sm btn-outline-warning w-100" onClick={handleResetPassword}>
                      <i className="bi bi-envelope"></i> Send Reset Email
                    </button>
                  </div>
                )}
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
