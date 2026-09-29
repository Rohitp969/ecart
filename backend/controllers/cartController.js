import { Cart } from "../models/cartModel.js";
import { Product } from "../models/productModel.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId")
    if (!cart) {
      return res.json({ success: true, cart: [] });
    }
    // drop items whose product was deleted by the admin
    if (cart.items.some((item) => !item.productId)) {
      cart.items = cart.items.filter((item) => item.productId);
      cart.totalPrice = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      await cart.save();
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    //check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if (product.stock === 0) {
      return res.status(400).json({ success: false, message: "This product is out of stock" });
    }

    //find the user's cart (if exists)
    let cart = await Cart.findOne({ userId })

    const inCart = cart?.items.find((item) => item.productId.toString() === productId)?.quantity || 0;
    if (typeof product.stock === "number" && inCart + 1 > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} in stock, and they're all in your cart`,
      });
    }

    //if cart doesn't exists, create a new one
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity: 1, price: product.productPrice }],
        totalPrice: product.productPrice,
      });
    } else {
      //Find if product is already in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (itemIndex > -1) {
        //if product exists -> just increase quantity
        cart.items[itemIndex].quantity += 1;
      } else {
        //if new product exists -> push to cart
        cart.items.push({
          productId,
          quantity: 1,
          price: product.productPrice,
        });
      }

      //Recalculate total price
      cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.price * item.quantity, 0
      );
    }

    //Save update cart
    await cart.save();

    await cart.populate("items.productId");

    return res.status(200).json({
       success: true,
       cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const userId = req.id;
    const { productId, type } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    const item = cart.items.find(
      (item) => item.productId.toString() === productId,
    );
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
       if (type === "increase") {
        const product = await Product.findById(productId).select("stock");
        if (typeof product?.stock === "number" && item.quantity + 1 > product.stock) {
          return res.status(400).json({
            success: false,
            message: product.stock > 0 ? `Only ${product.stock} in stock` : "This product is out of stock",
          });
        }
        item.quantity += 1;
       }

      if (type === "decrease" && item.quantity > 1) {
        item.quantity -= 1;
       }

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    await cart.save();
    cart = await cart.populate("items.productId");
    res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart)
      return res.status(404).json({ 
      success: false, 
      message: "Cart not found" 
      });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId )
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity, 0 );

     cart = await cart.populate("items.productId");

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
