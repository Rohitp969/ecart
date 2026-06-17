import React from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OrderCart = ({ userOrder }) => {
  const navigate = useNavigate();
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="w-full p-2 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button className = "cursor-pointer" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>
        {userOrder?.length === 0 ? (
          <p className="text-gray-800 space-y-6 text-2xl">
            No Orders found for this user
          </p>
        ) : (
          <div className="space-y-6 w-full">
            {userOrder?.map((order) => (
              <div
                key={order._id}
                className="shadow-lg rounded-2xl p-5 border  border-gray-200"
              >
                {/* order header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold">
                    Order ID:
                    <span className="text-gray-600 break-all">
                      {" "}
                      {order._id}
                    </span>
                  </h2>

                  <div className="flex items-center gap-30">
                    <p className="text-sm text-gray-500">
                      Amount:
                      <span className="font-bold ml-1">
                        {order.currency} {order.amount.toFixed(2)}
                      </span>
                    </p>

                    <span
                      className={`${
                        order.status === "Paid"
                          ? "bg-green-500"
                          : order.status === "Failed"
                            ? "bg-red-500"
                            : "bg-orange-300"
                      } text-white px-2 py-1 rounded-lg`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* user info */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="mb-4 flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">User:</span>{" "}
                      {order.user?.firstName || "Unknown"}{" "}
                      {order.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 break-all">
                      Email: {order.user?.email || "N/A"}
                    </p>
                  </div>
                </div>

                {/* products */}
                <div>
                  {console.log(order.products)}
                  <h3 className="font-medium mb-2">Products:</h3>
                  <ul className="space-y-2">
                    {order.products.map((product, index) => (
                      <li
                        key={index}
                        className="flex flex-col md:flex-row gap-3 bg-gray-50 p-3 rounded-lg"
                      >
                        <img
                          onClick={() =>
                            navigate(`/products/${product?.productId?._id}`)
                          }
                          className="w-16 h-16 object-cover cursor-pointer rounded"
                          src={product.productId?.productImg?.[0].url}
                          alt=""
                        />
                        <div className="flex-1">
                          <p className="font-medium break-words">
                            {product.productId?.productName}
                          </p>

                          <p className="text-xs text-gray-500 break-all">
                            {product?.productId?._id}
                          </p>

                          <p className="font-medium mt-1">
                            ₹{product.productId?.productPrice} x{" "}
                            {product.quantity}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCart;
