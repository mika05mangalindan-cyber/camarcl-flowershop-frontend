import React, { useState, useEffect, useMemo, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL;
const USERS_API = `${API_URL}/users`;

const IconUser = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconEdit = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 21l3-1 11-11 1-3-3 1L4 19z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 5l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 6l1-2h4l1 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const UserRow = React.memo(({ user, onEdit, onDelete }) => {
  const roleColor = useMemo(
    () => (user.role === "admin" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"),
    [user.role]
  );

  return (
    <tr className="border-b hover:bg-blue-50 transition text-sm">
      <td className="p-3 flex items-center gap-2 min-w-[160px]">
        <span className="p-1 rounded-full bg-gray-100 text-gray-600"><IconUser /></span>
        <span className="truncate">{user.name}</span>
        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded ${roleColor}`}>{user.role}</span>
      </td>
      <td className="p-3 break-all">{user.email}</td>
      <td className="p-3">{user.contact_number || "-"}</td>
      <td className="p-3 flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(user)}
          aria-label={`Edit ${user.name}`}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2"
          type="button"
        >
          <IconEdit /> Edit
        </button>
        <button
          onClick={() => onDelete(user.id)}
          aria-label={`Delete ${user.name}`}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2"
          type="button"
        >
          <IconTrash /> Delete
        </button>
      </td>
    </tr>
  );
});


const UserCard = React.memo(({ user, onEdit, onDelete }) => {
  const roleColor = useMemo(
    () => (user.role === "admin" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"),
    [user.role]
  );

  return (
    <article className="bg-white p-5 rounded-2xl shadow hover:bg-blue-50 transition flex flex-col w-full">
      <div className="flex items-center gap-3 mb-3">
        <span className="p-2 rounded-full bg-gray-100 text-gray-600"><IconUser /></span>
        <h3 className="font-semibold text-gray-800 text-sm truncate">{user.name}</h3>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded ${roleColor}`}>{user.role}</span>
      </div>
      <p className="text-gray-600 text-xs break-words mb-1">{user.email}</p>
      <p className="text-gray-600 text-xs break-words mb-3">{user.contact_number || "-"}</p>
      <div className="flex gap-2 flex-wrap mt-auto">
        <button
          onClick={() => onEdit(user)}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
          type="button"
        >
          <IconEdit /> Edit
        </button>
        <button
          onClick={() => onDelete(user.id)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
          type="button"
        >
          <IconTrash /> Delete
        </button>
      </div>
    </article>
  );
});


const Skeleton = () => (
  <div className="animate-pulse p-4 space-y-2">
    <div className="h-6 bg-gray-200 rounded w-3/4" />
    <div className="h-6 bg-gray-200 rounded w-1/2" />
    <div className="h-6 bg-gray-200 rounded w-5/6" />
  </div>
);


export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", contact_number: "", role: "customer", password: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  useEffect(() => {
    const ac = new AbortController();
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(USERS_API, { signal: ac.signal });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
    return () => ac.abort();
  }, []);


  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleEdit = useCallback((user) => {
    setForm({ name: user.name, email: user.email, contact_number: user.contact_number, role: user.role, password: "" });
    setEditingId(user.id);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      const res = await fetch(`${USERS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || (!editingId && !form.password)) {
      alert("Please fill required fields.");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      contact_number: form.contact_number,
      role: form.role,
      ...(form.password ? { password: form.password } : {})
    };

    try {
      if (editingId) {
        const res = await fetch(`${USERS_API}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Update failed");
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      } else {
        const res = await fetch(USERS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        setUsers((prev) => [created, ...prev]);
        setCurrentPage(1);
      }
      setForm({ name: "", email: "", contact_number: "", role: "customer", password: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("There was an error. See console for details.");
    }
  }, [form, editingId]);


  const filteredUsers = useMemo(() =>
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole),
    [users, filterRole]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <main className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Users Management</h1>

     
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label htmlFor="name" className="sr-only">Full Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none w-full" required />

        <label htmlFor="email" className="sr-only">Email</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none w-full" required />

        <label htmlFor="contact_number" className="sr-only">Contact Number</label>
        <input id="contact_number" name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="Contact Number" className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none w-full" disabled={form.role === "admin"} />

        <label htmlFor="role" className="sr-only">Role</label>
        <select id="role" name="role" value={form.role} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none w-full">
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>

        <label htmlFor="password" className="sr-only">Password</label>
        <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder={editingId ? "Leave blank to keep current password" : "Password"} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none w-full col-span-1 sm:col-span-2" required={!editingId} />

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md transition-colors col-span-1 sm:col-span-2">
          {editingId ? "Update User" : "Add User"}
        </button>
      </form>

     
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <span className="text-lg font-medium text-gray-700">Users</span>
        <div className="flex items-center gap-2">
          <label htmlFor="filterRole" className="text-gray-600 text-sm font-medium">Filter:</label>
          <select id="filterRole" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

     
      {loading ? (
        <Skeleton />
      ) : filteredUsers.length === 0 ? (
        <p className="p-6 text-center text-gray-500">No users found.</p>
      ) : (
        <>
        
          <div className="hidden lg:block overflow-x-auto rounded-2xl">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Email</th>
                  <th className="p-3 text-left font-medium">Contact</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <UserRow key={user.id} user={user} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>

        
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden p-2">
            {currentUsers.map((user) => (
              <UserCard key={user.id} user={user} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}

  
      <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" aria-label="Pagination">
        <div className="flex items-center gap-2">
          <label className="text-gray-600 text-sm">Show:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border px-3 py-1 rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
          <span className="text-gray-600 text-sm">users</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 rounded-md text-white ${
              currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            type="button"
          >
            Previous
          </button>

          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className={`px-4 py-2 rounded-md text-white ${
              currentPage === totalPages || totalPages === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            type="button"
          >
            Next
          </button>
        </div>
      </nav>
    </main>
  );
}
