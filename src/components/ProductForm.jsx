import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL;

export default function ProductForm({ onSubmit, initialData = {}, editMode = false }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: null,
  });
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        name: initialData.name || "",
        price: initialData.price || "",
        stock: initialData.stock || "",
        category: initialData.category || "",
        description: initialData.description || "",
        image: null,
      });
      setExistingImageUrl(initialData.image_url || null);
      setPreviewUrl(initialData.image_url ? `${API_URL}${initialData.image_url}` : null);
    }
  }, [initialData, editMode]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0] || null;
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewUrl(file ? URL.createObjectURL(file) : existingImageUrl ? `${API_URL}${existingImageUrl}` : null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData, existingImageUrl);
      setFormData({ name: "", price: "", stock: "", category: "", description: "", image: null });
      setExistingImageUrl(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md grid gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" required className="p-2 border rounded-md w-full" />
      <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required className="p-2 border rounded-md w-full" />
      <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock" required className="p-2 border rounded-md w-full" />
      <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="p-2 border rounded-md w-full" />
      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="p-2 border rounded-md md:col-span-2 lg:col-span-3 w-full" />
      
      {previewUrl && <img src={previewUrl} alt="Preview" className="w-24 h-24 object-contain rounded-md" />}
      <input type="file" name="image" onChange={handleChange} accept="image/*" className="p-2 border rounded-md w-full" />

      <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md md:col-span-2 lg:col-span-3 w-full">
        {loading ? (editMode ? "Updating..." : "Adding...") : (editMode ? "Update Product" : "Add Product")}
      </button>
    </form>
  );
}





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



