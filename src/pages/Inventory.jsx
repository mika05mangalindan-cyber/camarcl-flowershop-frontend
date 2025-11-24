import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import InventoryCard from "../components/InventoryCard";
import InventoryTable from "../components/InventoryTable";


const API_URL = process.env.REACT_APP_API_URL;
const PRODUCTS_API = `${API_URL}/products`;

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("None");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showExportMenu, setShowExportMenu] = useState(false);


  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(PRODUCTS_API);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  
  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  
  const handleSearchChange = useMemo(() => debounce(value => {
    setSearchQuery(value.toLowerCase());
    setCurrentPage(1);
  }, 300), []);

  useEffect(() => {
    return () => handleSearchChange.cancel();
  }, [handleSearchChange]);


  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter !== "All") result = result.filter(p => p.category === categoryFilter);
    if (searchQuery.trim()) result = result.filter(p => p.name.toLowerCase().includes(searchQuery));

    if (sortOrder === "Low to High") result.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    else if (sortOrder === "High to Low") result.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));

    return result;
  }, [products, categoryFilter, sortOrder, searchQuery]);


  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Export to Excel
  const exportToExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const now = new Date().toLocaleString();
    const data = filteredProducts.map(p => ({
      Date: now,
      Name: p.name || "-",
      Category: p.category || "-",
      Stock: p.stock ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory_${now.replace(/[:\/, ]/g, "_")}.xlsx`);
    setShowExportMenu(false);
  }, [filteredProducts]);


  const exportToPDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    doc.setFontSize(14);
    doc.text("Products Stock Report", 10, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${date}`, 10, 22);

    const tableData = filteredProducts.map(p => [
      p.name || "-",
      p.category || "-",
      `PHP ${Number(p.price ?? 0).toLocaleString()}.00`,
      p.stock ?? 0,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [["Product", "Category", "Price", "Stock"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
      didParseCell: data => {
        if (data.section === "body" && data.column.index === 3) {
          data.cell.styles.textColor = Number(data.cell.raw) < 20 ? [220, 53, 69] : [25, 135, 84];
        }
      },
    });

    doc.save(`products_report_${date.replace(/[:\/, ]/g, "_")}.pdf`);
    setShowExportMenu(false);
  }, [filteredProducts]);

  if (loading) return <div className="p-6 text-center text-gray-600 font-medium">Loading inventory...</div>;

  return (
    <main className="p-4 sm:p-6 space-y-6">
     
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-gray-800">Inventory</h1>
        <div className="flex items-center gap-3 flex-wrap">
        
          <div className="flex items-center gap-2">
            <label htmlFor="categoryFilter" className="text-gray-600 text-sm font-medium">Filter:</label>
            <select id="categoryFilter" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="p-2 border rounded-md text-sm">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          
          <div className="flex items-center gap-2">
            <label htmlFor="sortOrder" className="text-gray-600 text-sm font-medium">Sort:</label>
            <select id="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2 border rounded-md text-sm">
              <option value="None">None</option>
              <option value="Low to High">Low to High</option>
              <option value="High to Low">High to Low</option>
            </select>
          </div>


          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search product..." onChange={e => handleSearchChange(e.target.value)} className="p-2 border rounded-md text-sm" />
          </div>


          <div className="relative">
            <button onClick={() => setShowExportMenu(prev => !prev)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium">Generate Report</button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-10">
                <button onClick={exportToExcel} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">Excel</button>
                <button onClick={exportToPDF} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentProducts.map(p => <InventoryCard key={p.id} product={p} />)}
      </div>



      <div className="hidden lg:block">
        <InventoryTable products={currentProducts} />
      </div>


      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Show:</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border px-3 py-1 rounded-md">
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-gray-600 text-sm">items</span>
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
