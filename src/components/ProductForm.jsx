import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const ProductForm = ({ fetchProducts, editMode, selectedProduct, cancelEdit }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); // file
  const [preview, setPreview] = useState(""); // preview URL

  useEffect(() => {
    if (editMode && selectedProduct) {
      setName(selectedProduct.name);
      setPrice(selectedProduct.price);
      setStock(selectedProduct.stock);
      setCategory(selectedProduct.category || "");
      setDescription(selectedProduct.description || "");
      setPreview(selectedProduct.image_url || "");
      setImage(null);
    } else {
      resetForm();
    }
  }, [editMode, selectedProduct]);

  const resetForm = () => {
    setName("");
    setPrice("");
    setStock("");
    setCategory("");
    setDescription("");
    setImage(null);
    setPreview("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!name || !price || !stock) return alert("Name, price, and stock are required");

  const data = new FormData();

  data.append("name", name);
  data.append("price", price);
  data.append("stock", stock);
  if (category) data.append("category", category);
  if (description) data.append("description", description);

  // Image handling
  if (image instanceof File) {
    data.append("image", image); // new file selected
  } else if (editMode && selectedProduct?.image_url) {
    data.append("existingImageUrl", selectedProduct.image_url); // keep existing
  }

  try {
    if (editMode) {
      await axios.put(`${API_URL}/products/${selectedProduct.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      await axios.post(`${API_URL}/products`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    fetchProducts(); // refresh list
    resetForm();     // clear form
    cancelEdit && cancelEdit(); // close edit mode
  } catch (err) {
    console.error("Submit error:", err);
    alert("Failed to save product");
  }
};


  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-white rounded-md shadow-md">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border px-2 py-1 rounded-md"
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border px-2 py-1 rounded-md"
        required
      />
      <input
        type="number"
        placeholder="Stock"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="w-full border px-2 py-1 rounded-md"
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border px-2 py-1 rounded-md"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border px-2 py-1 rounded-md"
      />
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && (
        <img src={preview} alt="preview" className="w-24 h-24 object-contain mt-2 border rounded-md" />
      )}
      <div className="flex gap-2 mt-2">
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md">
          {editMode ? "Update" : "Add"}
        </button>
        {editMode && (
          <button type="button" onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded-md">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;





// import React, { useState, useEffect, useCallback } from "react";

// const API_URL = process.env.REACT_APP_API_URL;

// export default function ProductForm({ onSubmit, initialData = {}, editMode = false }) {
//   const [formData, setFormData] = useState({
//     name: "",
//     price: "",
//     stock: "",
//     category: "",
//     description: "",
//     image: null,
//   });
//   const [existingImageUrl, setExistingImageUrl] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);

//   useEffect(() => {
//     if (editMode && initialData) {
//       setFormData({
//         name: initialData.name || "",
//         price: initialData.price || "",
//         stock: initialData.stock || "",
//         category: initialData.category || "",
//         description: initialData.description || "",
//         image: null,
//       });
//       setExistingImageUrl(initialData.image_url || null);
//       setPreviewUrl(initialData.image_url ? `${API_URL}${initialData.image_url}` : null);
//     }
//   }, [initialData, editMode]);

//   useEffect(() => {
//     return () => {
//       if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
//     };
//   }, [previewUrl]);

//   const handleChange = useCallback((e) => {
//     const { name, value, files } = e.target;
//     if (name === "image") {
//       const file = files[0] || null;
//       if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

//       setFormData(prev => ({ ...prev, image: file }));
//       setPreviewUrl(file ? URL.createObjectURL(file) : existingImageUrl ? `${API_URL}${existingImageUrl}` : null);
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }));
//     }
//   }, [existingImageUrl, previewUrl]);

//   const handleSubmit = useCallback(async (e) => {
//     e.preventDefault();
//     await onSubmit(formData, existingImageUrl);

//     if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

//     // Reset form
//     setFormData({ name: "", price: "", stock: "", category: "", description: "", image: null });
//     setExistingImageUrl(null);
//     setPreviewUrl(null);
//   }, [formData, existingImageUrl, onSubmit, previewUrl]);

//   return (
//     <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm md:shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//       <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required className="p-2 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none w-full" />
//       <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required className="p-2 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none w-full" />
//       <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required className="p-2 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none w-full" />
//       <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="p-2 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none w-full" />
//       <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded-md md:col-span-2 lg:col-span-3 focus:ring-2 focus:ring-blue-300 outline-none w-full" />

//       {previewUrl && (
//         <img
//           src={previewUrl}
//           alt="Product preview"
//           width={96}
//           height={96}
//           className="object-contain w-24 h-24 rounded-md mb-2"
//         />
//       )}

//       <input type="file" name="image" onChange={handleChange} accept="image/*" className="p-2 border rounded-md focus:ring-2 focus:ring-blue-300 outline-none w-full" />

//       <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold shadow-md md:col-span-2 lg:col-span-3 w-full transition-colors duration-150">
//         {editMode ? "Update Product" : "Add Product"}
//       </button>
//     </form>
//   );
// }



