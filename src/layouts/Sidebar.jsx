import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import axios from "axios";

/* --- Inline icons (tiny, avoids lucide-react bundle) --- */
const IconMenu = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconX = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const IconUser = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSettings = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 16.88l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.3 2.3A2 2 0 1 1 7.14.47l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V0h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 21.7 4.3l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconLogout = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
const IconBell = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

/* --- Sidebar component (optimized) --- */
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const socketRef = useRef(null);
  const audioRef = useRef(null);

  /* initialize audio once */
  useEffect(() => {
    const a = new Audio("/notification.mp3");
    a.preload = "auto";
    audioRef.current = a;
  }, []);

  const playSound = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {}); // suppressed autoplay errors
  }, []);

  /* fetch notifications (memoized) */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5500/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("fetchNotifications error:", err);
    }
  }, []);

  /* connect socket lazily on mount */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("socket.io-client"); // dynamic import keeps bundle small
        const { io } = mod;
        const s = io("http://localhost:5500", { autoConnect: true });
        socketRef.current = s;

        s.on("new_notification", (notif) => {
          setNotifications((prev) => {
            const next = [notif, ...prev];
            // keep a sane cap to avoid unbounded lists
            return next.length > 200 ? next.slice(0, 200) : next;
          });
          playSound();
        });

        s.on("connect_error", (err) => {
          // handle connecting issues silently
          console.debug("socket connect_error", err);
        });
      } catch (err) {
        console.error("socket init failed:", err);
      }
    })();

    fetchNotifications();

    return () => {
      mounted = false;
      if (socketRef.current && socketRef.current.disconnect) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [fetchNotifications, playSound]);

  /* derived values */
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  /* handlers - stable with useCallback */
  const markAsRead = useCallback(async (id) => {
    try {
      await axios.put(`http://localhost:5500/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await axios.delete(`http://localhost:5500/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("deleteNotification error:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead).map((n) => n.id);
      if (unread.length === 0) return;
      // batch requests to avoid flooding
      const BATCH = 10;
      for (let i = 0; i < unread.length; i += BATCH) {
        const batch = unread.slice(i, i + BATCH);
        await Promise.all(batch.map((id) => axios.put(`http://localhost:5500/notifications/${id}/read`)));
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, [notifications]);

  const onToggleNotifications = useCallback(() => {
    setShowNotifications((prev) => !prev);
    // if opening, refetch to sync
    if (!showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

  /* nav link style helper */
  const linkClass = useCallback(({ isActive }) =>
    `block px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive ? "bg-white text-green-700 font-semibold shadow" : "text-gray-200 hover:bg-green-600 hover:text-white hover:shadow-green-400/30"
    }`, []
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-green-700 text-white p-6 flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Mobile Header */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h2 className="text-xl font-bold tracking-wide">Camarcl Admin</h2>
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300 focus:outline-none" aria-label="Close sidebar">
            <IconX />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
          <h2 className="text-2xl font-bold tracking-wide">Camarcl Admin</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/products", label: "Products" },
              { to: "/orders", label: "Orders" },
              { to: "/inventory", label: "Inventory" },
              { to: "/users", label: "Users" },
            ].map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={linkClass} onClick={() => setIsOpen(false)}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto text-sm text-green-200 select-none">
          &copy; 2025 Camarcl Flowershop
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Header */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 z-30 bg-white shadow-md flex justify-between items-center px-4 lg:px-8 py-3">
          <button onClick={() => setIsOpen((s) => !s)} className="text-green-700 lg:hidden focus:outline-none" aria-label="Open sidebar">
            <IconMenu />
          </button>

          <h1 className="text-xl font-bold text-green-700 tracking-wide">Camarcl Flowershop</h1>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button onClick={onToggleNotifications} className="relative focus:outline-none" aria-label="Notifications" aria-expanded={showNotifications}>
                <IconBell className="h-6 w-6 text-gray-600" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50 border">
                  <div className="flex justify-between items-center px-3 py-2 border-b">
                    <span className="font-semibold text-gray-700 text-sm">Notifications</span>
                    <button onClick={markAllAsRead} className="text-blue-500 text-xs focus:outline-none hover:underline">Mark all as read</button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="p-2 text-gray-500 text-sm">No notifications</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <li key={n.id} className={`p-2 border-b text-sm flex justify-between items-start cursor-pointer ${n.isRead ? "text-gray-400" : "text-gray-800 font-medium"}`}>
                          <div onClick={() => markAsRead(n.id)} className="min-w-0">
                            <p className="truncate">{n.message}</p>
                            <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                          </div>
                          <button onClick={() => deleteNotification(n.id)} className="text-red-500 ml-2 focus:outline-none" aria-label="Delete notification">
                            <IconTrash />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen((s) => !s)} className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-full focus:outline-none hover:bg-green-700 transition" aria-haspopup="true" aria-expanded={userMenuOpen}>
                <IconUser />
                <span className="hidden sm:block font-medium">Admin User</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
                    <IconUser /> Profile
                  </NavLink>
                  <NavLink to="/account-settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
                    <IconSettings /> Settings
                  </NavLink>
                  <button onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 focus:outline-none">
                    <IconLogout /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Outlet */}
        <main className="pt-20 px-4 lg:px-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsOpen(false)} aria-hidden="true" />}
    </div>
  );
}
