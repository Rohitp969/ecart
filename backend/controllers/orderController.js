import { Cart } from "../models/cartModel.js";
import razorpayInstance from "../config/razorpay.js";
import { Order, ORDER_STATUSES, PAYMENT_METHODS } from "../models/orderModel.js";
import crypto from "crypto";
import mongoose from "mongoose";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";

const ADDRESS_FIELDS = ["fullName", "phone", "email", "address", "city", "state", "zip", "country"];

// keep only known string fields from the client-sent address
const cleanAddress = (input) => {
  if (!input || typeof input !== "object") return undefined;
  const address = {};
  for (const field of ADDRESS_FIELDS) {
    if (typeof input[field] === "string") address[field] = input[field].trim().slice(0, 200);
  }
  return Object.keys(address).length ? address : undefined;
};

// Checkout rules, mirrored by the frontend summary (frontend/src/lib/help.js)
const FREE_SHIPPING_ABOVE = 299;
const SHIPPING_FEE = 49;
const TAX_RATE = 0.05;
const round2 = (n) => Math.round(n * 100) / 100;

// COD orders are confirmed when placed, online ones once paid
const isConfirmed = (order) => order.status === "Paid" || order.paymentMethod === "COD";

// take items out of stock (-1) or put them back (+1); products without a stock number are skipped
const adjustStock = (products, direction) =>
  Promise.all(
    products.map((item) =>
      Product.updateOne(
        { _id: item.productId?._id || item.productId, stock: { $type: "number" } },
        { $inc: { stock: direction * item.quantity } },
      ),
    ),
  );

const emptyCart = (userId) => Cart.findOneAndUpdate({ userId }, { $set: { items: [], totalPrice: 0 } });

export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "Online" } = req.body;

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Choose a valid payment method" });
    }
    const address = cleanAddress(shippingAddress);
    if (!address?.fullName || !address.phone || !address.address || !address.city || !address.zip) {
      return res.status(400).json({ success: false, message: "Please add a complete delivery address" });
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate("items.productId", "productName productPrice stock");
    // items whose product was deleted can't be ordered
    const items = (cart?.items || []).filter((item) => item.productId);

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const unavailable = items.find((item) => typeof item.productId.stock === "number" && item.quantity > item.productId.stock);
    if (unavailable) {
      const { productName, stock } = unavailable.productId;
      return res.status(400).json({
        success: false,
        message: stock > 0 ? `Only ${stock} left of "${productName}". Please update your cart.` : `"${productName}" is out of stock`,
      });
    }

    // totals are always worked out here from current prices, never taken from the browser
    const products = items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.productPrice,
    }));
    const subtotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
    const tax = round2(subtotal * TAX_RATE);
    const amount = round2(subtotal + shipping + tax);

    const orderData = {
      user: req.user._id,
      products,
      amount,
      tax,
      shipping,
      currency: "INR",
      paymentMethod,
      status: "Pending",
      shippingAddress: address,
    };

    // Cash on delivery: the order is placed straight away, payment is collected at the door
    if (paymentMethod === "COD") {
      const order = await Order.create(orderData);
      await Promise.all([adjustStock(products, -1), emptyCart(req.user._id)]);
      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        dbOrder: order,
      });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const newOrder = await Order.create({ ...orderData, razorpayOrderId: razorpayOrder.id });

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
      // only an unpaid order of this user can be marked failed
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, user: userId, status: "Pending" },
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
      // status filter: a repeated verify call can't take the stock twice
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, user: userId, status: { $ne: "Paid" } },
        {
          status: "Paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true },
      );
      if (order) await adjustStock(order.products, -1);

      await emptyCart(userId);

      return res.json({
        success: true,
        message: "Payment Successfully",
        order,
      });
    } else {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, user: userId, status: "Pending" },
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
      .sort({ createdAt: -1 })
      .select("-razorpaySignature")
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

// Customer: cancel an own order that hasn't shipped yet
export const cancelMyOrder = async (req, res) => {
  try {
    const order = mongoose.isValidObjectId(req.params.orderId)
      ? await Order.findOne({ _id: req.params.orderId, user: req.id })
      : null;
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (!isConfirmed(order) || order.orderStatus !== "Processing") {
      return res.status(400).json({
        success: false,
        message:
          order.orderStatus === "Cancelled"
            ? "This order is already cancelled"
            : "This order can't be cancelled anymore. Please contact support.",
      });
    }

    order.orderStatus = "Cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = "customer";
    order.cancelReason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 200) : undefined;
    await order.save();
    await adjustStock(order.products, 1);
    await order.populate({ path: "products.productId", select: "productName productPrice productImg" });

    return res.status(200).json({
      success: true,
      message:
        order.status === "Paid"
          ? "Order cancelled. Your refund will reach the original payment method in 5–7 business days."
          : "Order cancelled successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

const ORDER_POPULATE = [
  { path: "user", select: "firstName lastName email phoneNo" },
  { path: "products.productId", select: "productName productPrice productImg category brand" },
];

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate(ORDER_POPULATE);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};

// Admin: move an order through fulfilment (Processing -> Shipped -> Delivered, or Cancelled)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    if (!ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
      });
    }
    const order = mongoose.isValidObjectId(req.params.orderId) ? await Order.findById(req.params.orderId) : null;
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (!isConfirmed(order) && ["Shipped", "Delivered"].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only paid or cash-on-delivery orders can be shipped or delivered",
      });
    }

    const wasCancelled = order.orderStatus === "Cancelled";
    const now = new Date();
    order.orderStatus = orderStatus;
    if (orderStatus === "Shipped") order.shippedAt = order.shippedAt || now;
    if (orderStatus === "Delivered") {
      order.shippedAt = order.shippedAt || now;
      order.deliveredAt = now;
      // cash collected at the door
      if (order.paymentMethod === "COD") order.status = "Paid";
    }
    if (orderStatus === "Cancelled" && !wasCancelled) {
      order.cancelledAt = now;
      order.cancelledBy = "admin";
    }
    await order.save();

    // confirmed orders hold stock: give it back on cancel, take it again if the order is revived
    if (isConfirmed(order) && wasCancelled !== (orderStatus === "Cancelled")) {
      await adjustStock(order.products, orderStatus === "Cancelled" ? 1 : -1);
    }
    await order.populate(ORDER_POPULATE);
    return res.status(200).json({
      success: true,
      message: `Order marked as ${orderStatus}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAID = { status: "Paid" };

// One row per day (ranges up to 90 days) or per month, with empty periods filled with zeros
const buildTimeline = (rows, start, end, granularity) => {
  const byKey = new Map(rows.map((row) => [row._id, row]));
  const timeline = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), granularity === "day" ? start.getUTCDate() : 1),
  );
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, granularity === "day" ? 10 : 7);
    const row = byKey.get(key);
    timeline.push({ date: key, amount: Math.round(row?.amount || 0), orders: row?.orders || 0 });
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return timeline;
};

// Paid revenue, paid order count, average order value and sign-ups for one period
const periodStats = async (dateMatch) => {
  const [agg] = await Order.aggregate([
    { $match: { ...dateMatch, ...PAID } },
    { $group: { _id: null, revenue: { $sum: "$amount" }, orders: { $sum: 1 } } },
  ]);
  const revenue = Math.round(agg?.revenue || 0);
  const orders = agg?.orders || 0;
  return {
    revenue,
    orders,
    avgOrderValue: orders ? Math.round(revenue / orders) : 0,
    newCustomers: await User.countDocuments(dateMatch),
  };
};

// Admin dashboard. ?days=7|30|90|365, or 0 (default) for all time.
export const getSalesData = async (req, res) => {
  try {
    const days = Math.max(0, Math.floor(Number(req.query.days) || 0));
    const now = new Date();
    const start = days ? new Date(now - days * DAY_MS) : null;
    const inPeriod = start ? { createdAt: { $gte: start } } : {};
    const inPrevious = start ? { createdAt: { $gte: new Date(now - 2 * days * DAY_MS), $lt: start } } : null;
    const granularity = days && days <= 90 ? "day" : "month";

    const paidItems = [
      { $match: { ...inPeriod, ...PAID } },
      { $unwind: "$products" },
      { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
    ];

    const [
      kpis,
      previous,
      totalUsers,
      totalProducts,
      totalOrders,
      allTimeRevenue,
      paymentStatus,
      fulfilment,
      timelineRows,
      firstPaidOrder,
      topProducts,
      categorySales,
      recentOrders,
      lowStock,
    ] = await Promise.all([
      periodStats(inPeriod),
      inPrevious ? periodStats(inPrevious) : null,
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $match: PAID }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Order.aggregate([{ $match: inPeriod }, { $group: { _id: "$status", value: { $sum: 1 } } }]),
      // fulfilment covers every confirmed order: paid online, or cash on delivery
      Order.aggregate([
        { $match: { ...inPeriod, $or: [PAID, { paymentMethod: "COD" }] } },
        { $group: { _id: { $ifNull: ["$orderStatus", "Processing"] }, value: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...inPeriod, ...PAID } },
        {
          $group: {
            _id: { $dateToString: { format: granularity === "day" ? "%Y-%m-%d" : "%Y-%m", date: "$createdAt" } },
            amount: { $sum: "$amount" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.findOne(PAID).sort({ createdAt: 1 }).select("createdAt"),
      Order.aggregate([
        ...paidItems,
        {
          $group: {
            _id: "$product._id",
            name: { $first: "$product.productName" },
            image: { $first: { $arrayElemAt: ["$product.productImg.url", 0] } },
            quantity: { $sum: "$products.quantity" },
            // orders don't store unit prices, so revenue uses the product's current price
            revenue: { $sum: { $multiply: ["$products.quantity", "$product.productPrice"] } },
          },
        },
        { $sort: { quantity: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        ...paidItems,
        {
          $group: {
            _id: "$product.category",
            quantity: { $sum: "$products.quantity" },
            revenue: { $sum: { $multiply: ["$products.quantity", "$product.productPrice"] } },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6).populate("user", "firstName lastName email"),
      Product.find({ stock: { $ne: null, $lte: 10 } }).sort({ stock: 1 }).limit(6).select("productName stock productImg"),
    ]);

    const timelineStart = start || firstPaidOrder?.createdAt || now;

    res.json({
      success: true,
      days,
      granularity,
      kpis,
      previous,
      totals: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        revenue: Math.round(allTimeRevenue[0]?.total || 0),
      },
      paymentStatus: paymentStatus.map((s) => ({ name: s._id, value: s.value })),
      fulfilment: fulfilment.map((s) => ({ name: s._id, value: s.value })),
      salesByDate: buildTimeline(timelineRows, timelineStart, now, granularity),
      topProducts: topProducts.map((p) => ({
        id: p._id,
        name: p.name,
        image: p.image,
        quantity: p.quantity,
        revenue: Math.round(p.revenue || 0),
      })),
      categorySales: categorySales.map((c) => ({
        category: c._id || "Other",
        quantity: c.quantity,
        revenue: Math.round(c.revenue || 0),
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order._id,
        customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : "Deleted user",
        email: order.user?.email,
        amount: order.amount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        items: order.products.reduce((sum, p) => sum + p.quantity, 0),
        date: order.createdAt,
      })),
      lowStock: lowStock.map((p) => ({
        id: p._id,
        name: p.productName,
        stock: p.stock,
        image: p.productImg?.[0]?.url,
      })),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
