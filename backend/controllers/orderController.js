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

export const getSalesData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({});

    //Total sales amount
    const totalSaleAgg = await Order.aggregate([
      { $match: { status: "Paid" } }, 
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }, 
        },
      },
    ]);

    const totalSales = totalSaleAgg[0]?.total || 0;

    //Sales grouped by date (last 30 days)

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDate = await Order.aggregate([
      { $match: { status: "Paid", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log(salesByDate);

    const formattedSales = salesByDate.map((item) => ({
      date: item._id,
      amount: item.amount,
    }));

    console.log(formattedSales);

    res.json({
      success: true,
      totalUsers,
      totalProducts,
      totalOrders,
      totalSales,
      sales: formattedSales,
    });
  } catch (error) {
    console.error("❌ Error fetching sales date:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
