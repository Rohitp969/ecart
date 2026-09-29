import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, CircleHelp, Headset, Search } from "lucide-react";
import HelpLayout from "@/components/HelpLayout";
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS, SHIPPING_FEE } from "@/lib/help";

const FAQ_SECTIONS = [
  {
    title: "Orders & Payments",
    items: [
      {
        q: "How do I place an order?",
        a: "Add products to your cart, open the cart and click Place Order. Choose or add a delivery address, pick a payment method (online or Cash on Delivery) and confirm.",
      },
      {
        q: "Which payment methods do you accept?",
        a: "Pay online through Razorpay with UPI, credit and debit cards (Visa, Mastercard, RuPay), net banking and popular wallets — or choose Cash on Delivery and pay in cash or UPI when your order arrives.",
      },
      {
        q: "How does Cash on Delivery work?",
        a: "Choose \"Cash on Delivery\" at checkout and your order is placed right away with nothing to pay now. Keep the order amount ready and pay the delivery partner in cash or UPI when the package arrives.",
      },
      {
        q: "Are there any extra charges at checkout?",
        a: `A 5% tax is added to the order subtotal. Shipping is free on orders above ₹${FREE_SHIPPING_ABOVE}; smaller orders have a flat ₹${SHIPPING_FEE} delivery fee. You'll see the full breakdown before you pay.`,
      },
      {
        q: "My payment failed but money was deducted. What now?",
        a: "Don't worry — if the payment didn't complete, your bank automatically reverses the amount within 5–7 business days. If it doesn't, contact us with your order ID and we'll sort it out.",
      },
      {
        q: "Can I cancel my order?",
        a: "Yes, as long as it hasn't shipped yet. Open My Account → My Orders and click \"Cancel order\". Online payments are refunded in full to the original payment method within 5–7 business days; Cash on Delivery orders have nothing to refund.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    items: [
      {
        q: "How can I track my order?",
        a: "Use the Track Order page with your order ID and email, or open My Profile → Orders when you're signed in. You'll see whether it's processing, shipped or delivered.",
      },
      {
        q: "How long does delivery take?",
        a: "Most orders arrive in 2–4 business days in metro cities and 4–7 business days elsewhere. Remote areas can take up to 10 business days.",
      },
      {
        q: "Do you offer free delivery?",
        a: `Yes! Every order above ₹${FREE_SHIPPING_ABOVE} ships free. Orders of ₹${FREE_SHIPPING_ABOVE} or less have a flat ₹${SHIPPING_FEE} delivery fee.`,
      },
      {
        q: "Can I change my delivery address after ordering?",
        a: "If the order hasn't shipped, contact us with your order ID and the new address and we'll update it.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: `Most items can be returned within ${RETURN_WINDOW_DAYS} days of delivery if they're unused and in their original packaging with tags. Grocery, opened beauty products and innerwear can't be returned for hygiene reasons.`,
      },
      {
        q: "How do I return a product?",
        a: "Send us a message from the Contact Us page with the topic \"Returns & refunds\" and your order ID. We'll arrange a free pickup from your address.",
      },
      {
        q: "When will I get my refund?",
        a: "Once the returned item passes a quality check, we refund to your original payment method. UPI and wallet refunds usually arrive within 2–3 business days, cards and net banking within 5–7.",
      },
      {
        q: "I received a damaged or wrong item.",
        a: "We're sorry! Contact us within 48 hours of delivery with your order ID and a photo of the item, and we'll send a replacement or a full refund.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the sign-in page click \"Forgot password\", enter your email and we'll send you a one-time code (OTP) to set a new password.",
      },
      {
        q: "How do I update my name, phone or address?",
        a: "Sign in and open My Account from the menu. Update your name and phone under Profile Information, and add, edit or pick a default delivery address under Saved Addresses.",
      },
      {
        q: "Do I need an account to shop?",
        a: "You can browse without an account, but you'll need to sign in to add items to your cart and check out, so we can keep your orders safe.",
      },
    ],
  },
];

const Faqs = () => {
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_SECTIONS;
    return FAQ_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(q)),
    })).filter((section) => section.items.length);
  }, [query]);

  return (
    <HelpLayout title="Frequently Asked Questions" description="Quick answers about orders, payments, delivery, returns and your account." icon={CircleHelp}>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, e.g. refund, delivery, password"
          aria-label="Search FAQs"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <CircleHelp className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 font-semibold text-gray-900">No questions match "{query}"</p>
          <p className="mt-1 text-sm text-gray-500">Try a different word, or ask us directly.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{section.title}</h2>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {section.items.map((item) => (
                  <details key={item.q} className="group" open={Boolean(query.trim())}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-gray-900 transition hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-5 pb-5 text-sm leading-6 text-gray-600">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-pink-100 bg-pink-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Headset className="h-8 w-8 shrink-0 text-pink-600" />
          <div>
            <p className="font-semibold text-gray-900">Still need help?</p>
            <p className="text-sm text-gray-600">Our support team replies within 24 hours.</p>
          </div>
        </div>
        <Link to="/contact" className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
          Contact us
        </Link>
      </div>
    </HelpLayout>
  );
};

export default Faqs;
