import React, { memo, useMemo } from "react";

const API_URL = process.env.REACT_APP_API_URL;

// Memoized OrderCard for small/medium screens
const OrderCard = memo(({ order }) => {
  // Calculate total
  const orderTotal = useMemo(
    () => order.items.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [order.items]
  );

  // Status styles
  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-orange-700 bg-orange-100";
      case "delivered":
        return "text-green-700 bg-green-100";
      case "cancelled":
      case "returned":
      case "cancelled/returned":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  // Format date
  const formattedDate = useMemo(() => {
    if (!order.created_at) return "N/A";
    return new Date(order.created_at.replace(" ", "T")).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [order.created_at]);

  return (
    <div className="bg-white border rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 truncate">{order.user_name || "Unknown User"}</h3>
        <span className="text-gray-500 text-sm">{formattedDate}</span>
      </div>

      {/* Items */}
      <div className="grid gap-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 bg-gray-50 p-2 rounded-md"
          >
            {item.image_url ? (
              <img
                src={`${API_URL}${item.image_url}`}
                alt={item.product_name || "Product Image"}
                className="w-16 h-16 rounded-md object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-gray-400 text-xs italic rounded-md">
                No Img
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="font-medium text-gray-800 truncate">{item.product_name || "Unnamed Product"}</span>
              <span className="text-gray-700 text-sm">Qty: {item.quantity || 0}</span>
            </div>
            <div className="text-red-500 font-semibold ml-auto">
              PHP {Number(item.total || 0).toLocaleString()}.00
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
        <span className="font-semibold text-gray-800">
          Total: PHP {orderTotal.toLocaleString()}.00
        </span>
        <span className="text-gray-700 font-semibold">
          Payment: {order.payment_mode || "N/A"}
        </span>
        <span
          className={`font-semibold px-2 py-1 rounded inline-block ${getStatusClasses(order.status)}`}
        >
          {order.status || "Unknown"}
        </span>
      </div>
    </div>
  );
});

export default OrderCard;
