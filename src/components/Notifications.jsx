// import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
// import axios from "axios";

// const API_URL = process.env.REACT_APP_API_URL;
// const NOTIFICATIONS_API = `${API_URL}/notifications`;

// // Icons (Bell, Check, Trash) omitted for brevity — keep your originals

// const NotificationItem = React.memo(({ n, markAsRead, deleteNotification }) => {
//   return (
//     <li
//       className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
//         n.isRead ? "bg-gray-50" : "bg-white"
//       }`}
//       role="listitem"
//     >
//       {n.image_url ? (
//         <img
//           src={n.image_url.startsWith("http") ? n.image_url : `${API_URL}${n.image_url}`}
//           alt={n.product_name || "Notification"}
//           className="w-12 h-12 object-cover rounded-md flex-shrink-0"
//         />
//       ) : (
//         <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-md text-gray-400 text-xs italic flex-shrink-0">
//           No Img
//         </div>
//       )}

//       <div className="flex-1 flex flex-col gap-1 min-w-0">
//         <p className="text-sm text-gray-800 font-medium truncate">{n.message}</p>
//         {n.product_name && <p className="text-xs text-gray-500 truncate">Product: {n.product_name}</p>}
//         {n.quantity && <p className="text-xs text-gray-500">Qty: {n.quantity}</p>}
//         <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
//       </div>

//       <div className="flex flex-col items-end gap-1">
//         {!n.isRead && (
//           <button
//             onClick={() => markAsRead(n.id)}
//             className="text-green-600 text-xs hover:underline focus:outline-none"
//           >
//             Mark as read
//           </button>
//         )}
//         <button
//           onClick={() => deleteNotification(n.id)}
//           className="text-red-500 text-xs hover:underline flex items-center gap-1 focus:outline-none"
//         >
//           Delete
//         </button>
//       </div>
//     </li>
//   );
// });

// export default function Notifications() {
//   const [notifications, setNotifications] = useState([]);
//   const [showDropdown, setShowDropdown] = useState(false);

//   const socketRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const audioRef = useRef(null);

//   useEffect(() => {
//     audioRef.current = new Audio("/notification.mp3");
//     audioRef.current.preload = "auto";
//   }, []);

//   const playSound = useCallback(() => {
//     const a = audioRef.current;
//     if (!a) return;
//     a.currentTime = 0;
//     a.play().catch(() => {});
//   }, []);

//   const fetchNotifications = useCallback(async () => {
//     try {
//       const res = await axios.get(NOTIFICATIONS_API);
//       setNotifications((res.data || []).map(n => ({ ...n, isRead: !!n.isRead })));
//     } catch (err) {
//       console.error("Error fetching notifications:", err);
//     }
//   }, []);

//   useEffect(() => {
//     const initSocket = async () => {
//       const { io } = await import("socket.io-client");
//       const s = io(API_URL, { autoConnect: true });
//       socketRef.current = s;

//       s.on("connect_error", (err) => console.debug("socket connect error", err));

//       s.on("new_notification", (notif) => {
//         setNotifications(prev => [{ ...notif, isRead: !!notif.isRead }, ...prev].slice(0, 200));
//         playSound();
//       });
//     };

//     initSocket();
//     fetchNotifications();

//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       socketRef.current?.disconnect();
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [fetchNotifications, playSound]);

//   const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

//   const markAsRead = useCallback(async (id) => {
//     try {
//       await axios.put(`${NOTIFICATIONS_API}/${id}/read`);
//       setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
//     } catch (err) {
//       console.error(err);
//     }
//   }, []);

//   const markAllAsRead = useCallback(async () => {
//     try {
//       const unread = notifications.filter(n => !n.isRead).map(n => n.id);
//       const BATCH = 10;
//       for (let i = 0; i < unread.length; i += BATCH) {
//         const batch = unread.slice(i, i + BATCH);
//         await Promise.all(batch.map(id => axios.put(`${NOTIFICATIONS_API}/${id}/read`)));
//       }
//       setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
//     } catch (err) {
//       console.error(err);
//     }
//   }, [notifications]);

//   const deleteNotification = useCallback(async (id) => {
//     try {
//       await axios.delete(`${NOTIFICATIONS_API}/${id}`);
//       setNotifications(prev => prev.filter(n => n.id !== id));
//     } catch (err) {
//       console.error(err);
//     }
//   }, []);

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <button
//         onClick={() => setShowDropdown(prev => !prev)}
//         className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
//         aria-label="Notifications"
//         aria-expanded={showDropdown}
//       >
//         <IconBell />
//         {unreadCount > 0 && (
//           <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs animate-pulse">
//             {unreadCount}
//           </span>
//         )}
//       </button>

//       {showDropdown && (
//         <div className="absolute right-0 mt-2 w-80 max-w-full sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden z-50 border">
//           <div className="flex justify-between items-center p-3 border-b bg-gray-50">
//             <span className="font-semibold text-gray-700 text-sm">Notifications</span>
//             {unreadCount > 0 && (
//               <button onClick={markAllAsRead} className="flex items-center gap-1 text-green-600 text-xs hover:underline focus:outline-none">
//                 <IconCheck /> Mark all
//               </button>
//             )}
//           </div>

//           {notifications.length === 0 ? (
//             <div className="p-4 text-gray-500 text-sm text-center">No notifications</div>
//           ) : (
//             <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200">
//               {notifications.map(n => (
//                 <NotificationItem key={n.id} n={n} markAsRead={markAsRead} deleteNotification={deleteNotification} />
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
