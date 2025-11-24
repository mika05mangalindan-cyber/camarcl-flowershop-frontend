import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const ProductForm = ({ fetchProducts, editMode, selectedProduct, cancelEdit }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); // new file
  const [preview, setPreview] = useState(""); // preview URL

  // Populate form when editing
  useEffect(() => {
    if (editMode && selectedProduct) {
      setName(selectedProduct.name || "");
      setPrice(selectedProduct.price || "");
      setStock(selectedProduct.stock || "");
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
    setPreview(file ? URL.createObjectURL(file) : "");
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

    if (image instanceof File) {
      data.append("image", image); // new image
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
      cancelEdit && cancelEdit(); // exit edit mode
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








