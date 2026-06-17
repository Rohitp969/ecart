import { Cart } from "../models/cartModel.js";
import razorpayInstance from "../config/razorpay.js";
import { Order } from "../models/orderModel.js";
import crypto from "crypto";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";

export const createOrder = async (req, res) => {
  try {
    const { amount, tax, shipping, currency } = req.body;

    // 🔥 Get cart
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // 🔥 Map products from cart
    const products = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const newOrder = new Order({
      user: req.user._id,
      products, // ✅ correct now
      amount,
      tax,
      shipping,
      currency,
      status: "Pending",
      razorpayOrderId: razorpayOrder.id,
    });

    await newOrder.save();

    res.json({
      success: true,
      order: razorpayOrder,
      dbOrder: newOrder,
    });
  } catch (error) {
    console.log("❌ Error in create Order:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const varifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentFailed,
    } = req.body;
    const userId = req.user._id;

    if (paymentFailed) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "Failed" },
        { new: true },
      );
      return res.status(400).json({
        success: false,
        message: "Payment failed",
        order,
      });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "Paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true },
      );

      await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [], totalPrice: 0 } },
      );

      return res.json({
        success: true,
        message: "Payment Successfully",
        order,
      });
    } else {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "Failed" },
        { new: true },
      );
      return res.status(400).json({
        success: false,
        message: "Invalid Signature",
      });
    }
  } catch (error) {
    console.log("❌ Error in create Order:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyOrder = async (req, res) => {
  try {
    const userId = req.id;
    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg",
      })
      .populate("user", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Admin only

export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params; //userId will come from URL

    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg",
      }) // fetch product details
      .populate("user", "firstName lastName email"); //fetch user info

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email") // populate user info
      .populate("products.productId", "productName productPrice"); // populate product info

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed tp fetch all orders",
      error: error.message,
    });
  }
};

// export const getSalesData = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments({});
//     const totalProducts = await Product.countDocuments({});
//     const totalOrders = await Order.countDocuments({});

//     //Total sales amount
//     const totalSaleAgg = await Order.aggregate([
//       { $match: { status: "Paid" } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: "$amount" },
//         },
//       },
//     ]);

//     const totalSales = totalSaleAgg[0]?.total || 0;

//     //Sales grouped by date (last 30 days)

//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//     const salesByDate = await Order.aggregate([
//       { $match: { status: "Paid", createdAt: { $gte: thirtyDaysAgo } } },
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
//           },
//           amount: { $sum: "$amount" },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);

//     console.log(salesByDate);

//     const formattedSales = salesByDate.map((item) => ({
//       date: item._id,
//       amount: item.amount,
//     }));

//     console.log(formattedSales);

//     res.json({
//       success: true,
//       totalUsers,
//       totalProducts,
//       totalOrders,
//       totalSales,
//       sales: formattedSales,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching sales date:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getSalesData = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;

    const currentStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    currentStartDate.setDate(currentStartDate.getDate() - days);

    const previousStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    previousStartDate.setDate(previousStartDate.getDate() - days * 2);

    // ===================
    // BASIC COUNTS
    // ===================

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const totalOrders = await Order.countDocuments({
      status: "Paid",
      createdAt: {
        $gte: currentStartDate,
      },
    });

    // ===================
    // TOTAL SALES
    // ===================

    const salesAgg = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: {
            $gte: currentStartDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalSales = salesAgg[0]?.totalSales || 0;

    // ===================
    // SALES TREND
    // ===================

    const salesByDate = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: {
            $gte: currentStartDate,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          amount: {
            $sum: "$amount",
          },
          orders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const formattedSales = salesByDate.map((item) => ({
      date: item._id,
      amount: item.amount,
      orders: item.orders,
    }));

    // ===================
    // PREVIOUS PERIOD SALES
    // ===================

    const previousSalesAgg = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: {
            $gte: previousStartDate,
            $lt: currentStartDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const previousOrders = await Order.countDocuments({
      status: "Paid",
      createdAt: {
        $gte: previousStartDate,
        $lt: currentStartDate,
      },
    });

    const previousPeriodStats = {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: previousOrders,
      totalSales: previousSalesAgg[0]?.totalSales || 0,
    };

    // ===================
    // TOP PRODUCTS
    // ===================

    const topProducts = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: {
            $gte: currentStartDate,
          },
        },
      },

      { $unwind: "$products" },

      {
        $group: {
          _id: "$products.productId",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },

      { $sort: { totalQuantity: -1 } },

      { $limit: 5 },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },

      { $unwind: "$product" },

      {
        $project: {
          _id: 0,
          name: "$product.productName",
          sales: "$totalQuantity",
        },
      },
    ]);

    // ===================
    // CATEGORY DISTRIBUTION
    // ===================

    const categoryDistribution = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: {
            $gte: currentStartDate,
          },
        },
      },

      { $unwind: "$products" },

      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },

      { $unwind: "$product" },

      {
        $group: {
          _id: "$product.category",
          value: { $sum: "$products.quantity" },
        },
      },

      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },
    ]);

    // ===================
    // RECENT ORDERS
    // ===================

    const recentOrders = await Order.find({ status: "Paid" })
      .sort({ createdAt: -1 })
      .limit(5);

    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order._id,
      customer: order.name || "Customer",
      amount: order.amount,
      status: order.status,
      date: new Date(order.createdAt).toLocaleDateString(),
    }));

    // ===================
    // RESPONSE
    // ===================

    res.json({
      success: true,
      totalUsers,
      totalProducts,
      totalOrders,
      totalSales,
      salesByDate: formattedSales,
      // topProducts: [],
      // categoryDistribution: [],
      topProducts,
      categoryDistribution,
      recentOrders: formattedRecentOrders,
      previousPeriodStats,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
