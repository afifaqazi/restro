import { useState, useEffect } from "react";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "../models/menuCategoryModel";
import { getAllMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "../models/menuModel";
import { showToast } from "../helpers/toast";
import { formatCurrency } from "../helpers/formatters";

export default function Menu({ user }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  
  // Modals state
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catFormName, setCatFormName] = useState("");

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: "", categoryId: "", price: "", description: "" });

  const isAdmin = user?.type === "admin";

  const loadData = async () => {
    try {
      const fetchedCats = await getAllCategories();
      const fetchedItems = await getAllMenuItems();
      setCategories(fetchedCats);
      setMenuItems(fetchedItems);
    } catch (err) {
      console.error(err);
      showToast("Failed to load menu data", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (catFilter && item.categoryId !== catFilter) return false;
    return true;
  });

  // Category Handlers
  const handleCatSave = async () => {
    if (!catFormName.trim()) { showToast("Category name is required", "error"); return; }
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catFormName });
        showToast("Category updated", "success");
      } else {
        await createCategory({ name: catFormName });
        showToast("Category created", "success");
      }
      setShowCatModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to save category", "error");
    }
  };

  const handleCatDelete = async (id) => {
    if (!window.confirm("Soft-delete this category?")) return;
    try {
      await deleteCategory(id);
      showToast("Category deleted", "success");
      loadData();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  // Item Handlers
  const handleItemSave = async () => {
    if (!itemForm.name.trim()) { showToast("Item name is required", "error"); return; }
    if (!itemForm.categoryId) { showToast("Category is required", "error"); return; }
    try {
      const dataToSave = {
        name: itemForm.name.trim(),
        categoryId: itemForm.categoryId,
        price: parseFloat(itemForm.price) || 0,
        description: itemForm.description.trim()
      };
      if (editingItem) {
        await updateMenuItem(editingItem.id, dataToSave);
        showToast("Item updated", "success");
      } else {
        await createMenuItem(dataToSave);
        showToast("Item created", "success");
      }
      setShowItemModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to save item", "error");
    }
  };

  const handleItemDelete = async (id) => {
    if (!window.confirm("Soft-delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      showToast("Item deleted", "success");
      loadData();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const getCatName = (id) => categories.find(c => c.id === id)?.name || "Unknown";

  return (
    <>
      <div className="manage-header">
        <h3 className="manage-header__title">Categories</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => { setEditingCat(null); setCatFormName(""); setShowCatModal(true); }}>
            <i className="bi bi-plus-lg"></i> Add Category
          </button>
        </div>
      </div>
      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan="3" className="empty-state"><p>No categories found.</p></td></tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td><span className="badge bg-success">Active</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingCat(cat); setCatFormName(cat.name); setShowCatModal(true); }}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleCatDelete(cat.id)}>Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="manage-header" style={{ paddingTop: '12px' }}>
        <h3 className="manage-header__title">Menu Items</h3>
        <div className="manage-header__actions">
          <button className="btn-add" onClick={() => { setEditingItem(null); setItemForm({ name: "", categoryId: "", price: "", description: "" }); setShowItemModal(true); }}>
            <i className="bi bi-plus-lg"></i> Add Item
          </button>
        </div>
      </div>
      <div className="manage-toolbar">
        <div className="manage-search">
          <i className="bi bi-search"></i>
          <input type="text" placeholder="Search menu items…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="manage-filter" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div className="manage-table-wrap">
        <table className="manage-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan="5" className="empty-state"><p>No items found.</p></td></tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{getCatName(item.categoryId)}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td><span className="badge bg-success">Active</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setEditingItem(item); setItemForm({ name: item.name, categoryId: item.categoryId, price: item.price, description: item.description || "" }); setShowItemModal(true); }}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-outline-danger" onClick={() => handleItemDelete(item.id)}>Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCatModal && (
        <div className="modal-overlay show">
          <div className="modal-box">
            <div className="modal-header">
              <h5>{editingCat ? "Edit Category" : "Add Category"}</h5>
              <button className="modal-close" onClick={() => setShowCatModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row single">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={catFormName} onChange={e => setCatFormName(e.target.value)} placeholder="e.g. Appetizers" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCatModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleCatSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="modal-overlay show">
          <div className="modal-box">
            <div className="modal-header">
              <h5>{editingItem ? "Edit Item" : "Add Item"}</h5>
              <button className="modal-close" onClick={() => setShowItemModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g. Chicken Karahi" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })}>
                    <option value="">Select...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group"></div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Optional description…" rows="2"></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowItemModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleItemSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
