import React, { useEffect, useState, useCallback, memo, lazy, Suspense, useMemo } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import ProductForm from "../components/ProductForm";

const API_URL = process.env.REACT_APP_API_URL;
const PRODUCTS_API = `${API_URL}/products`;

const FiEdit2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiEdit2 })));
const FiTrash2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiTrash2 })));

const ProductCard = memo(({ product, onEdit, onDelete }) => (
  <div className="bg-white shadow-sm rounded-xl p-3 flex hover:bg-blue-50 transition-transform transform hover:scale-[1.02] duration-150">
    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md mr-3 bg-gray-50">
      {product.image_url ? (
        <img
          src={product.image_url || ""}
          alt={product.name}
          width={80}
          height={80}
          className="object-contain w-full h-full"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">
          No Image
        </div>
      )}
    </div>
    <div className="flex-1 flex flex-col justify-between">
      <div className="mb-2">
        <h2 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h2>
        <p className="text-gray-500 text-xs truncate">Category: {product.category || "-"}</p>
        <p className="text-gray-700 text-xs">Price: PHP {Number(product.price).toLocaleString()}.00</p>
        <p className={`text-xs font-medium ${product.stock < 20 ? "text-red-600" : "text-green-600"}`}>
          Stock: {product.stock}
        </p>
      </div>
      <Suspense fallback={null}>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 bg-green-600 text-white py-1 rounded-md text-xs flex items-center justify-center gap-1 hover:bg-green-700 transition-colors duration-150"
          >
            <FiEdit2 /> Edit
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="flex-1 bg-red-500 text-white py-1 rounded-md text-xs flex items-center justify-center gap-1 hover:bg-red-600 transition-colors duration-150"
          >
            <FiTrash2 /> Delete
          </button>
        </div>
      </Suspense>
    </div>
  </div>
));

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterValue, setFilterValue] = useState("All");
  const [sortValue, setSortValue] = useState("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", price: "", stock: "", category: "", description: "", image: null });
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(PRODUCTS_API);
      const data = res.data;
      setProducts(data);
      setFilteredProducts(data);
      setCategories([...new Set(data.map(p => p.category).filter(Boolean))]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applyFilterAndSort = useCallback((filter, sort) => {
    let updated = [...products];
    if (filter.startsWith("category:")) updated = updated.filter(p => p.category === filter.split(":")[1]);
    if (sort === "stock-asc") updated.sort((a, b) => a.stock - b.stock);
    if (sort === "stock-desc") updated.sort((a, b) => b.stock - a.stock);
    if (sort === "price-asc") updated.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") updated.sort((a, b) => b.price - a.price);
    setFilteredProducts(updated);
    setCurrentPage(1);
  }, [products]);

  const handleFilterChange = useCallback(value => { setFilterValue(value); applyFilterAndSort(value, sortValue); }, [sortValue, applyFilterAndSort]);
  const handleSortChange = useCallback(value => { setSortValue(value); applyFilterAndSort(filterValue, value); }, [filterValue, applyFilterAndSort]);

  const handleSearchChange = useMemo(() => debounce(value => { setSearchQuery(value.toLowerCase()); setCurrentPage(1); }, 300), []);

const [selectedProduct, setSelectedProduct] = useState(null);

const handleEdit = (product) => {
  setEditMode(true);
  setSelectedId(product.id);
  setSelectedProduct(product);
};

const handleDelete = useCallback(async (id) => {
  if (!window.confirm("Are you sure you want to delete this product?")) return;
  try {
    await axios.delete(`${PRODUCTS_API}/${id}`);
    await fetchProducts(); 
  } catch (err) {
    console.error("Delete failed:", err);
  }
}, [fetchProducts]);

  const handleExportPDF = useCallback(async () => {
    requestIdleCallback(async () => {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.setFontSize(14);
      doc.text("Products Stock Report", 10, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}`, 10, 22);
      const tableData = filteredProducts.map(p => [p.name, p.category || "-", `PHP ${Number(p.price).toLocaleString()}.00`, p.stock]);
      autoTable(doc, {
        startY: 28,
        head: [["Product", "Category", "Price", "Stock"]],
        body: tableData,
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        headStyles: { fillColor: [33, 150, 243], textColor: [255, 255, 255] },
        didParseCell: data => { if (data.section === "body" && data.column.index === 3) { const val = Number(data.cell.raw); data.cell.styles.textColor = val < 20 ? [220,53,69] : [25,135,84]; } },
      });
      doc.save(`products_report_${date.replace(/[:\/, ]/g, "_")}.pdf`);
    });
  }, [filteredProducts]);

  const handleExportExcel = useCallback(async () => {
    requestIdleCallback(async () => {
      const XLSX = await import("xlsx");
      const worksheetData = filteredProducts.map(p => ({ Name: p.name, Category: p.category || "-", Price: p.price, Stock: p.stock }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, `products_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }, [filteredProducts]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = useMemo(() => filteredProducts.slice(indexOfFirst, indexOfLast), [filteredProducts, indexOfFirst, indexOfLast]);
  const searchedProducts = useMemo(() => currentProducts.filter(p => p.name.toLowerCase().includes(searchQuery)), [currentProducts, searchQuery]);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
     <ProductForm
      key={selectedId || "new"}
      initialData={editMode ? selectedProduct : {}}
      editMode={editMode}
      onSubmit={async (formData, existingImageUrl) => {
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (key !== "image") data.append(key, value);
        });
        if (formData.image instanceof File) data.append("image", formData.image);
        else if (editMode && existingImageUrl) data.append("existingImageUrl", existingImageUrl);

        try {
          if (editMode) {
            await axios.put(`${PRODUCTS_API}/${selectedId}`, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } else {
            await axios.post(PRODUCTS_API, data, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
          await fetchProducts();
          setEditMode(false);
          setSelectedId(null);
          setSelectedProduct(null);
        } catch (err) {
          console.error(err);
        }
      }}
    />


      <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Products</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <select value={filterValue} onChange={e => handleFilterChange(e.target.value)} className="border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-200 text-sm sm:text-base bg-white">
            <option value="All">All</option>
            {categories.map((cat,i) => <option key={i} value={`category:${cat}`}>{cat}</option>)}
          </select>
          <select value={sortValue} onChange={e => handleSortChange(e.target.value)} className="border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-200 text-sm sm:text-base bg-white">
            <option value="none">None</option>
            <option value="stock-asc">Stock: Low to High</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <input type="text" placeholder="Search products..." onChange={e => handleSearchChange(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-blue-200 bg-white transition" />
          <div className="relative">
            <button onClick={() => setShowReportOptions(prev => !prev)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium">Generate Report</button>
            {showReportOptions && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-10 flex flex-col">
                <button onClick={handleExportPDF} className="px-4 py-2 text-left hover:bg-gray-100 text-sm">Export PDF</button>
                <button onClick={handleExportExcel} className="px-4 py-2 text-left hover:bg-gray-100 text-sm">Export Excel</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-xl" />)}
        </div>
      ) : searchedProducts.length === 0 ? (
        <p className="text-center p-6 text-gray-500 italic">No products found.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden lg:block rounded-2xl border">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-blue-50 border-t border-gray-200 transition-all duration-200">
                    <td className="p-3 border-t border-gray-200 w-20">
                      {product.image_url ? (
                        <img src={product.image_url || ""} alt={product.name} width={64} height={64} className="w-16 h-16 object-contain rounded-md" loading="lazy" />
                      ) : <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs italic">No Img</div>}
                    </td>
                    <td className="p-3 border-t border-gray-200 font-medium">{product.name}</td>
                    <td className="p-3 border-t border-gray-200">{product.category || "-"}</td>
                    <td className="p-3 border-t border-gray-200">PHP {Number(product.price).toLocaleString()}.00</td>
                    <td className={`p-3 border-t border-gray-200 ${product.stock < 20 ? "text-red-600" : "text-green-600"}`}>{product.stock}</td>
                    <td className="p-3 border-t border-gray-200 flex gap-2 flex-wrap">
                      <Suspense fallback={null}>
                        <button onClick={() => handleEdit(product)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors duration-150"><FiEdit2 /> Edit</button>
                        <button onClick={() => handleDelete(product.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors duration-150"><FiTrash2 /> Delete</button>
                      </Suspense>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:hidden gap-3">
            {searchedProducts.map(product => <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />)}
          </div>
        </>
      )}


      <section className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 flex-wrap">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-600 text-sm">Show:</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border px-2 py-1 rounded-md text-sm">
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-gray-600 text-sm">products</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`px-3 py-1 rounded-md text-white text-sm ${currentPage === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Previous</button>
          <span className="text-gray-700 font-medium text-sm shrink-0">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className={`px-3 py-1 rounded-md text-white text-sm ${currentPage === totalPages || totalPages === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Next</button>
        </div>
      </section>
    </main>
  );
}

