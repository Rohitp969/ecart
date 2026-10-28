import { Coupon } from "../models/couponModel.js";

// Checkout maths shared by order creation and the coupon check, mirrored by
// checkoutTotals in frontend/src/lib/orders.js.

const round2 = (n) => Math.round(n * 100) / 100;

// Shipping and tax are worked out on the subtotal after the coupon discount
export const orderTotals = (subtotal, settings, discount = 0) => {
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping = afterDiscount > settings.freeShippingAbove ? 0 : settings.shippingFee;
    const tax = round2(afterDiscount * (settings.taxRate / 100));
    return { subtotal, discount: round2(discount), shipping, tax, amount: round2(afterDiscount + shipping + tax) };
};

export class CouponError extends Error {}

// Finds an active code and works out its discount on this subtotal; throws CouponError when it can't be used
export const evaluateCoupon = async (rawCode, subtotal) => {
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";
    if (!code) throw new CouponError("Enter a coupon code");
    const coupon = await Coupon.findOne({ code });
    if (!coupon || !coupon.active) throw new CouponError(`"${code}" isn't a valid coupon code`);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new CouponError(`"${code}" has expired`);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new CouponError(`"${code}" has reached its usage limit`);
    if (subtotal < (coupon.minOrder || 0)) {
        throw new CouponError(`Add ₹${Math.ceil(coupon.minOrder - subtotal)} more to use "${code}" (minimum order ₹${coupon.minOrder})`);
    }
    let discount = coupon.type === "percent" ? subtotal * (coupon.value / 100) : coupon.value;
    if (coupon.type === "percent" && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = round2(Math.min(discount, subtotal));
    return { coupon, discount };
};

// count one use once the order is confirmed (COD placed, or online payment verified)
export const recordCouponUse = (code) => (code ? Coupon.updateOne({ code }, { $inc: { usedCount: 1 } }) : null);
