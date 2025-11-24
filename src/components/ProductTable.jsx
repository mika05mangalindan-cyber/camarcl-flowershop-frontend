import React, { Suspense, lazy } from "react";

const API_URL = process.env.REACT_APP_API_URL;

// Lazy load icons
const FiEdit2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiEdit2 })));
const FiTrash2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiTrash2 })));

export default function ProductTable({ products, onEdit, onDelete }) {
  return (
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
          {products.map(product => (
            <tr key={product.id} className="hover:bg-blue-50 border-t border-gray-200 transition-all duration-200">
              <td className="p-3 border-t border-gray-200 w-20">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain rounded-md"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs italic">No Img</div>
                )}
              </td>
              <td className="p-3 border-t border-gray-200 font-medium">{product.name}</td>
              <td className="p-3 border-t border-gray-200">{product.category || "-"}</td>
              <td className="p-3 border-t border-gray-200">PHP {Number(product.price).toLocaleString()}.00</td>
              <td className={`p-3 border-t border-gray-200 ${product.stock < 20 ? "text-red-600" : "text-green-600"}`}>{product.stock}</td>
              <td className="p-3 border-t border-gray-200 flex gap-2 flex-wrap">
                <Suspense fallback={null}>
                  <button onClick={() => onEdit(product)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors duration-150">Edit</button>
                  <button onClick={() => onDelete(product.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs flex items-center gap-1 transition-colors duration-150">Delete</button>
                </Suspense>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
