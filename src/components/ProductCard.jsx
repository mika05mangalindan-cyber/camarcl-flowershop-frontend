import React, { memo, Suspense, lazy } from "react";

const API_URL = process.env.REACT_APP_API_URL;

// Lazy load icons
const FiEdit2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiEdit2 })));
const FiTrash2 = lazy(() => import("react-icons/fi").then(mod => ({ default: mod.FiTrash2 })));

const ProductCard = memo(({ product, onEdit, onDelete }) => (
  <div className="bg-white shadow-sm rounded-xl p-3 flex hover:bg-blue-50 transition-transform transform hover:scale-[1.02] duration-150">
    <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md mr-3 bg-gray-50">
      {product.image_url ? (
        <img
          src={`${API_URL}${product.image_url}`}
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

      <Suspense fallback={<div className="flex gap-2 mt-2"><div className="flex-1 bg-gray-200 h-6 rounded-md animate-pulse" /></div>}>
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

export default ProductCard;
