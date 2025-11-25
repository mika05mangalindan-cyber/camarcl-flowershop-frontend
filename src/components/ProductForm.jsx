import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProductForm({ editMode, selectedProduct, fetchProducts, cancelEdit }) {
  const initialForm = {
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    existingImageUrl: ""
  };

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);
  const isEditing = editMode && selectedProduct;

  // Populate form if editing
  useEffect(() => {
    if (isEditing) {
      setForm({
        name: selectedProduct.name,
        price: selectedProduct.price,
        stock: selectedProduct.stock,
        category: selectedProduct.category,
        description: selectedProduct.description,
        existingImageUrl: selectedProduct.image_url
      });
      setImage(null);
    } else {
      resetForm();
    }
  }, [isEditing, selectedProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(initialForm);
    setImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.price);
      fd.append("stock", form.stock);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("existingImageUrl", form.existingImageUrl);

      if (image) fd.append("image", image);

      if (isEditing) {
        await axios.put(`${API_URL}/products/${selectedProduct.id}`, fd);
      } else {
        await axios.post(`${API_URL}/products`, fd);
      }

      fetchProducts();
      resetForm();       // Reset form after add/update
      cancelEdit();      // Exit edit mode if applicable
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit");
    }
  };

  const handleCancel = () => {
    resetForm();
    cancelEdit();        // Exit edit mode
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 bg-white rounded-xl shadow-md mb-4">
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border rounded px-2 py-1" />
      <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required className="border rounded px-2 py-1" />
      <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} required className="border rounded px-2 py-1" />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border rounded px-2 py-1" />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border rounded px-2 py-1" />
      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required={!isEditing} className="mt-1" />
      {isEditing && form.existingImageUrl && (
        <img src={form.existingImageUrl} alt="current" className="w-20 h-20 object-cover mt-2" />
      )}
      <div className="flex gap-2 mt-2">
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md">
          {isEditing ? "Update Product" : "Add Product"}
        </button>
        {isEditing && (
          <button type="button" onClick={handleCancel} className="bg-gray-400 text-white px-3 py-1 rounded-md">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}












// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const API_URL = process.env.REACT_APP_API_URL;

// const ProductForm = ({ fetchProducts, editMode = false, selectedProduct = null, cancelEdit }) => {
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState("");
//   const [stock, setStock] = useState("");
//   const [category, setCategory] = useState("");
//   const [description, setDescription] = useState("");
//   const [image, setImage] = useState(null); // File
//   const [preview, setPreview] = useState(""); // preview URL

//   useEffect(() => {
//     if (editMode && selectedProduct) {
//       setName(selectedProduct.name);
//       setPrice(selectedProduct.price);
//       setStock(selectedProduct.stock);
//       setCategory(selectedProduct.category || "");
//       setDescription(selectedProduct.description || "");
//       setPreview(selectedProduct.image_url || "");
//       setImage(null);
//     } else {
//       resetForm();
//     }
//   }, [editMode, selectedProduct]);

//   const resetForm = () => {
//     setName("");
//     setPrice("");
//     setStock("");
//     setCategory("");
//     setDescription("");
//     setImage(null);
//     setPreview("");
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     setImage(file);
//     setPreview(file ? URL.createObjectURL(file) : "");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!name || !price || !stock) return alert("Name, price, and stock are required");

//     const data = new FormData();
//     data.append("name", name);
//     data.append("price", price);
//     data.append("stock", stock);
//     if (category) data.append("category", category);
//     if (description) data.append("description", description);

//     // Image handling
//     if (image instanceof File) {
//       data.append("image", image); // new file selected
//     } else if (editMode && selectedProduct?.image_url) {
//       data.append("existingImageUrl", selectedProduct.image_url); // keep existing
//     }

//     try {
//       if (editMode) {
//         await axios.put(`${API_URL}/products/${selectedProduct.id}`, data, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       } else {
//         await axios.post(`${API_URL}/products`, data, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//       }

//       fetchProducts(); // refresh list
//       resetForm();
//       cancelEdit && cancelEdit();
//     } catch (err) {
//       console.error("Submit error:", err);
//       alert("Failed to save product");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-white rounded-md shadow-md">
//       <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-2 py-1 rounded-md" required />
//       <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border px-2 py-1 rounded-md" required />
//       <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border px-2 py-1 rounded-md" required />
//       <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border px-2 py-1 rounded-md" />
//       <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border px-2 py-1 rounded-md" />
//       <input type="file" accept="image/*" onChange={handleImageChange} />
//       {preview && <img src={preview} alt="preview" className="w-24 h-24 object-contain mt-2 border rounded-md" />}
//       <div className="flex gap-2 mt-2">
//         <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md">{editMode ? "Update" : "Add"}</button>
//         {editMode && (
//           <button type="button" onClick={cancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded-md">Cancel</button>
//         )}
//       </div>
//     </form>
//   );
// };

// export default ProductForm;








