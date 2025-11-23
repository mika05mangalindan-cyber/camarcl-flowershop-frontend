import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import axios from "axios";

// Lazy-load heavy libraries and components
const XLSX = React.lazy(() => import("xlsx"));
const jsPDF = React.lazy(() => import("jspdf"));
const autoTable = React.lazy(() => import("jspdf-autotable"));
const BarChartWrapper = React.lazy(() => import("../components/BarChartWrapper"));
const OrderCard = React.lazy(() => import("../components/OrderCard"));

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [salesMonthFilter, setSalesMonthFilter] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");

  const categoryColors = useMemo(() => [
    "#22C55E","#3B82F6","#FACC15","#EF4444","#8B5CF6","#F97316","#06B6D4",
  ], []);

  // Filtered recent orders based on search
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return recentOrders;
    const query = searchQuery.toLowerCase();
    return recentOrders.filter(order =>
      order.user_name.toLowerCase().includes(query) ||
      order.items.some(item => item.product_name.toLowerCase().includes(query))
    );
  }, [recentOrders, searchQuery]);

  // Fetch dashboard data
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [ordersRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/orders`),
          axios.get(`${API_URL}/users`),
        ]);
        if (!mounted) return;

        const orders = ordersRes.data;
        const users = usersRes.data;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentMonthName = now.toLocaleString("default", { month: "long" });

        const deliveredOrders = orders.filter(o => (o.status || "").trim().toLowerCase() === "delivered");
        const deliveredThisMonth = deliveredOrders.filter(o => {
          const d = new Date(o.created_at.replace(" ", "T"));
          return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });

        const ordersThisMonth = deliveredThisMonth.length;
        const revenueThisMonth = deliveredThisMonth.reduce((sum, o) => sum + (parseFloat(o.item_total) || 0), 0);

        // Most sold product
        const productCounts = {};
        deliveredThisMonth.forEach(o => {
          productCounts[o.product_name] = (productCounts[o.product_name] || 0) + o.quantity;
        });
        const mostSoldProduct = Object.entries(productCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "N/A";

        setStats({
          totalOrders: deliveredOrders.length,
          totalRevenue: deliveredOrders.reduce((sum, o) => sum + (parseFloat(o.item_total) || 0), 0),
          totalProducts: new Set(orders.map(o=>o.product_id)).size,
          totalUsers: users.length,
          ordersThisMonth,
          revenueThisMonth,
          mostSoldProduct,
          currentMonthName,
        });

        // Group recent orders
        const groupedOrders = {};
        orders.forEach(o => {
          if (!groupedOrders[o.order_id]) groupedOrders[o.order_id] = { ...o, items: [] };
          groupedOrders[o.order_id].items.push({
            id: o.order_item_id,
            product_name: o.product_name,
            quantity: o.quantity,
            image_url: o.image_url,
            total: o.item_total,
          });
        });

        setRecentOrders(Object.values(groupedOrders)
          .sort((a,b)=> new Date(b.created_at.replace(" ","T")) - new Date(a.created_at.replace(" ","T")))
          .slice(0,5)
        );

        // Sales data based on filter
        const applySalesFilter = () => {
          let filtered = deliveredOrders;
          if (salesMonthFilter !== "all") {
            let [filterYear, filterMonth] = salesMonthFilter === "current"
              ? [currentYear, currentMonth]
              : salesMonthFilter.split("-").map(Number);
            filtered = deliveredOrders.filter(o => {
              const d = new Date(o.created_at.replace(" ","T"));
              return d.getFullYear() === filterYear && d.getMonth()+1 === filterMonth;
            });
          }
          const salesMap = {};
          filtered.forEach(o => {
            const cat = o.category || o.product_name;
            salesMap[cat] = (salesMap[cat] || 0) + (parseFloat(o.item_total) || 0);
          });
          setSalesData(Object.entries(salesMap).map(([category,total]) => ({ category, total })));
        };
        applySalesFilter();

        setLoading(false);
      } catch(err){
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      }
    };

    fetchData();
    return () => mounted = false;
  }, [salesMonthFilter]);

  // Export report
  const exportReport = useCallback(async (format) => {
    const now = new Date().toLocaleString();
    const reportTitle = "Sales Report";

    const revenue = salesMonthFilter === "all"
      ? stats.totalRevenue
      : salesMonthFilter === "current"
        ? stats.revenueThisMonth
        : salesData.reduce((sum,item)=>sum+item.total,0);

    const reportSubtitle = salesMonthFilter === "current"
      ? `Revenue for ${stats.currentMonthName}: PHP ${Number(stats.revenueThisMonth).toLocaleString()}.00`
      : salesMonthFilter === "all"
        ? `All Time Revenue: PHP ${Number(stats.totalRevenue).toLocaleString()}.00`
        : (() => {
            const [year, month] = salesMonthFilter.split("-");
            const monthName = new Date(`${month}-01-${year}`).toLocaleString("default",{month:"long"});
            return `Revenue for ${monthName} ${year}: PHP ${Number(revenue).toLocaleString()}.00`;
          })();

    const data = salesData.map(d => ({ Category: d.category, Sales: d.total }));

    if (format === "excel") {
      const XLSX = (await import("xlsx")).default;
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.sheet_add_aoa(ws, [
        [reportSubtitle],
        [`Most Sold Product`, stats.mostSoldProduct],
        [],
      ], { origin: "A1" });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SalesReport");
      XLSX.writeFile(wb, `Sales_Report_${now.replace(/[:\/, ]/g,"_")}.xlsx`);
    } else if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(18); doc.setTextColor("#1E40AF"); doc.text(`${reportTitle} - ${now}`, 14, 20);
      doc.setFontSize(12); doc.setTextColor("#111827"); doc.text(reportSubtitle, 14, 30);
      doc.text(`Most Sold Product: ${stats.mostSoldProduct}`, 14, 37);
      autoTable(doc, {
        startY: 45,
        head:[["Category","Sales (PHP)"]],
        body: data.map(d=>[d.Category,`PHP ${Number(d.Sales).toLocaleString()}.00`]),
        headStyles:{fillColor:"#3B82F6", textColor:"#fff", fontStyle:"bold"},
        bodyStyles:{fontSize:11,cellPadding:3},
        theme:"grid"
      });
      doc.save(`Sales_Report_${now.replace(/[:\/, ]/g,"_")}.pdf`);
    }

    setShowExportMenu(false);
  }, [salesData, stats, salesMonthFilter]);

  if(loading) return <p className="p-4 text-gray-600">Loading dashboard...</p>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label:`Orders (${stats.currentMonthName})`, value: stats.ordersThisMonth, color:"bg-green-500" },
          { label:`Revenue (${stats.currentMonthName})`, value:`PHP ${stats.revenueThisMonth?.toLocaleString()}.00`, color:"bg-blue-500" },
          { label:"Most Sold Product", value: stats.mostSoldProduct, color:"bg-yellow-500" },
          { label:"Users", value: stats.totalUsers, color:"bg-purple-500" },
        ].map((card,i)=>(
          <div key={i} className={`${card.color} text-white shadow-lg rounded-xl p-5 transform  hover:shadow-lg transition-transform duration-200`}>
            <p className="text-sm opacity-90">{card.label}</p>
            <h3 className="text-2xl font-bold break-words leading-tight mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div className="bg-white shadow-md rounded-xl p-6 relative w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Sales by Category</h2>
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700 text-sm">Month:</label>
            <select value={salesMonthFilter} onChange={e=>setSalesMonthFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200 bg-white">
              <option value="current">Current Month</option>
              <option value="all">All Time</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-11">November 2025</option>
            </select>
          </div>
          <div className="relative">
            <button onClick={()=>setShowExportMenu(prev=>!prev)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Generate Report
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10">
                <button onClick={()=>exportReport("excel")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">Excel</button>
                <button onClick={()=>exportReport("pdf")} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">PDF</button>
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-[300px] sm:h-[400px] md:h-[450px]">
          <Suspense fallback={<p className="text-gray-500 text-center">Loading chart...</p>}>
            <BarChartWrapper data={salesData} colors={categoryColors} />
          </Suspense>
        </div>
      </div>

      {/* Recent Orders with Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-200 bg-white"
            />
            {/* <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
            >
              
            </button> */}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-500 italic text-center">No orders match your search.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full border-collapse">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Products</th>
                    <th className="px-4 py-3 text-center font-semibold">Qty</th>
                    <th className="px-4 py-3 text-center font-semibold">Payment</th>
                    <th className="px-4 py-3 text-center font-semibold">Total</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order=>{
                    const orderTotal = order.items.reduce((sum,i)=>sum+Number(i.total||0),0);
                    return (
                      <tr key={order.order_id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                        <td className="px-4 py-3 align-middle">
                          <div className="text-gray-500 text-sm mb-1">{new Date(order.created_at.replace(" ","T")).toLocaleDateString()}</div>
                          <div className="font-semibold text-gray-800">{order.user_name}</div>
                        </td>
                        <td className="px-4 py-3 space-y-1 align-middle">
                          {order.items.map(item=>(
                            <div key={item.id} className="flex items-center gap-2">
                              {item.image_url ? (
                                <img src={`${API_URL}${item.image_url}`} alt={item.product_name} className="w-12 h-12 object-cover rounded-md" loading="lazy"/>
                              ):(
                                <div className="w-12 h-12 flex items-center justify-center text-gray-400 text-xs italic rounded-md border border-gray-200">No Img</div>
                              )}
                              <span>{item.product_name}</span>
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-center align-middle space-y-1">{order.items.map(i=><div key={i.id}>{i.quantity}</div>)}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700 align-middle">{order.payment_mode}</td>
                        <td className="px-4 py-3 text-center font-semibold text-red-500 align-middle">PHP {orderTotal.toLocaleString()}.00</td>
                        <td className={`px-4 py-3 text-center font-semibold align-middle ${order.status.toLowerCase()==="delivered"?"text-green-700":order.status.toLowerCase()==="pending"?"text-orange-700":"text-red-700"}`}>{order.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Medium screens */}
            <div className="hidden sm:grid md:hidden grid-cols-2 gap-4">
              {filteredOrders.map(o => (
                <Suspense key={o.order_id} fallback={<p>Loading order...</p>}>
                  <OrderCard order={o} />
                </Suspense>
              ))}
            </div>

            {/* Small screens */}
            <div className="sm:hidden grid gap-4">
              {filteredOrders.map(o => (
                <Suspense key={o.order_id} fallback={<p>Loading order...</p>}>
                  <OrderCard order={o} />
                </Suspense>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
