import React, { useEffect, useState, useCallback, memo, useMemo } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = process.env.REACT_APP_API_URL;
const ORDERS_API = `${API_URL}/orders`;

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "delivered": return "text-green-600";
    case "pending": return "text-yellow-600";
    case "cancelled/returned": return "text-red-600";
    default: return "text-gray-600";
  }
};


const OrderCard = memo(({ order, onStatusChange }) => (
  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:bg-blue-50 transition-transform duration-200">
    <h2 className="font-semibold text-lg mb-3">{order.user_name}</h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      {order.items.map(item => (
        <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
          {item.image_url ? (
            <img
              src={item.image_url.startsWith("http") ? item.image_url : `${API_URL}${item.image_url}`}
              alt={item.product_name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs italic rounded-md flex-shrink-0">
              No Img
            </div>
          )}
          <div className="flex flex-col justify-center">
            <span className="font-medium text-sm">{item.product_name}</span>
            <span className="text-gray-500 text-xs">{item.quantity} PCS</span>
          </div>
        </div>
      ))}
    </div>

    <div className="flex justify-between items-center mb-3 text-gray-700 gap-4 flex-wrap">
      <span className="font-semibold text-red-500 text-sm">
        Total: PHP {Number(order.total).toLocaleString()}.00
      </span>
      <span className="font-semibold text-sm">Payment: {order.payment_mode}</span>
    </div>

    <select
      value={order.status}
      onChange={(e) => onStatusChange(order.id, e.target.value)}
      className={`w-full border rounded-md px-3 py-1 text-sm font-semibold ${getStatusColor(order.status)} focus:ring-2 focus:ring-green-200 bg-white transition`}
    >
      <option value="Pending">Pending</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled/Returned">Cancelled/Returned</option>
    </select>
  </div>
));

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(ORDERS_API); 

      const groupedOrders = res.data.reduce((acc, row) => {
        let order = acc.find(o => o.id === row.order_id);
        if (!order) {
          order = {
            id: row.order_id,
            user_name: row.user_name,
            total: row.order_total,
            payment_mode: row.payment_mode,
            status: row.status,
            created_at: row.created_at,
            items: [],
          };
          acc.push(order);
        }
        order.items.push({
          id: row.order_item_id,
          product_name: row.product_name,
          quantity: row.quantity,
          image_url: row.image_url || null,
        });
        return acc;
      }, []);

      setOrders(groupedOrders);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);


  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      await axios.put(`${ORDERS_API}/${orderId}/status`, { status: newStatus }); // ✅ use ORDERS_API
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) { console.error(err); }
  }, []);

 
  const handleSearchChange = useMemo(() => debounce((value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 300), []);

  
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => statusFilter === "All" || o.status.toLowerCase() === statusFilter.toLowerCase())
      .filter(o => !searchQuery || o.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [orders, statusFilter, searchQuery]);


  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentOrders = useMemo(() => filteredOrders.slice(indexOfFirst, indexOfLast), [filteredOrders, indexOfFirst, indexOfLast]);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);


  const handleExportExcel = useCallback(() => {
    const data = filteredOrders.map(o => ({
      Name: o.user_name,
      Products: o.items.map(i => i.product_name).join(", "),
      Qty: o.items.map(i => i.quantity).join(", "),
      Total: o.total,
      Payment: o.payment_mode,
      Status: o.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders_report.xlsx");
  }, [filteredOrders]);

  
  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Orders Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = filteredOrders.map(o => [
      o.user_name,
      o.items.map(i => i.product_name).join("\n"),
      o.items.map(i => i.quantity).join("\n"),
      `PHP ${Number(o.total).toLocaleString()}.00`,
      o.payment_mode,
      new Date(o.created_at).toLocaleDateString(),
      o.status,
    ]);

    autoTable(doc, {
      head: [["Name", "Products", "Qty", "Total", "Payment", "Date", "Status"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0,128,0] },
      columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 15 } },
    });

    doc.save("orders_report.pdf");
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {Array.from({ length: itemsPerPage }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 space-y-6">
      {/* Header + Filter + Search + Report */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
        <div className="flex items-center gap-3 flex-wrap relative">
          <label className="text-gray-600 text-sm md:text-base font-medium">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-blue-200 bg-white transition"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled/Returned">Cancelled/Returned</option>
          </select>

          <input
            type="text"
            placeholder="Search orders..."
            onChange={e => handleSearchChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-blue-200 bg-white transition"
          />

          <div className="relative inline-block text-left">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Generate Report
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button onClick={() => { handleExportExcel(); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Excel</button>
                  <button onClick={() => { handleExportPDF(); setDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
        {currentOrders.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
        ))}
      </div>


      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm lg:text-base border-collapse">
          <thead className="bg-blue-700 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-center font-semibold">Qty</th>
              <th className="px-4 py-3 text-center font-semibold">Total</th>
              <th className="px-4 py-3 text-center font-semibold">Payment</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map(order => (
              <tr key={order.id} className="border-b border-gray-200 hover:bg-blue-50 align-middle">
                <td className="px-4 py-3 align-middle">{order.user_name}</td>
                <td className="px-4 py-3 align-middle">
                  {order.items.map(i => (
                    <div key={i.id} className="flex items-center gap-2 mb-1">
                      {i.image_url ? (
                      <img
                        src={i.image_url.startsWith("http") ? i.image_url : `${API_URL}${i.image_url}`}
                        alt={i.product_name}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 text-xs italic rounded-md flex-shrink-0">No Img</div>
                      )}
                      <span>{i.product_name}</span>
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 text-center align-middle">{order.items.map(i => <div key={i.id}>{i.quantity}</div>)}</td>
                <td className="px-4 py-3 text-center text-red-500 font-semibold align-middle">PHP {Number(order.total).toLocaleString()}.00</td>
                <td className="px-4 py-3 text-center align-middle">{order.payment_mode}</td>
                <td className="px-4 py-3 text-center align-middle">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`border rounded-md px-2 py-1 text-sm font-semibold ${getStatusColor(order.status)} focus:ring-2 focus:ring-green-200 bg-white transition`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled/Returned">Cancelled/Returned</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Show:</span>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border px-3 py-1 rounded-md">
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-gray-600 text-sm">orders</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`px-4 py-2 rounded-md text-white ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Previous</button>
          <span className="text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className={`px-4 py-2 rounded-md text-white ${currentPage === totalPages || totalPages === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Next</button>
        </div>
      </div>
    </main>
  );
}
