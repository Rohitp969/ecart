import React from "react";
import { Link } from "react-router-dom";
import { Ban, Clock, PackageCheck, RotateCcw, Truck, Wallet } from "lucide-react";
import HelpLayout, { HelpCard } from "@/components/HelpLayout";
import { FREE_SHIPPING_ABOVE, RETURN_WINDOW_DAYS, SHIPPING_FEE } from "@/lib/help";

const HIGHLIGHTS = [
  { icon: Truck, title: "Free shipping", text: `On orders above ₹${FREE_SHIPPING_ABOVE}`, color: "bg-blue-50 text-blue-600" },
  { icon: Clock, title: "Fast delivery", text: "2–7 business days", color: "bg-purple-50 text-purple-600" },
  { icon: RotateCcw, title: `${RETURN_WINDOW_DAYS}-day returns`, text: "Free doorstep pickup", color: "bg-amber-50 text-amber-600" },
  { icon: Wallet, title: "Quick refunds", text: "To your original payment method", color: "bg-green-50 text-green-600" },
];

const DELIVERY_TIMES = [
  ["Metro cities", "Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad", "2–4 business days"],
  ["Other cities & towns", "Rest of India", "4–7 business days"],
  ["Remote areas", "North-East, J&K, islands and hilly regions", "7–10 business days"],
];

const RETURN_STEPS = [
  { title: "Request a return", text: "Contact us with your order ID and choose \"Returns & refunds\"." },
  { title: "Pack the item", text: "Keep it unused with the original packaging, tags and accessories." },
  { title: "Free pickup", text: "Our courier partner collects it from your address within 2–3 days." },
  { title: "Get your refund", text: "Once the item passes a quality check, we start your refund." },
];

const REFUND_TIMES = [
  ["UPI / Wallets", "2–3 business days"],
  ["Debit & credit cards", "5–7 business days"],
  ["Net banking", "5–7 business days"],
];

const NON_RETURNABLE = [
  "Grocery and other perishable items",
  "Opened beauty, skincare and fragrance products",
  "Innerwear, socks and swimwear",
  "Items that are used, damaged by the customer, or missing tags",
];

const tableClass = "w-full text-left text-sm";
const thClass = "bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500";

const ShippingReturns = () => (
  <HelpLayout
    title="Shipping & Returns"
    description="Everything about delivery charges, delivery times, returns and refunds."
    icon={Truck}
  >
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {HIGHLIGHTS.map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <HelpCard title="Shipping charges">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Order value</th>
                <th className={thClass}>Delivery fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 text-gray-700">Up to ₹{FREE_SHIPPING_ABOVE}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">₹{SHIPPING_FEE}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Above ₹{FREE_SHIPPING_ABOVE}</td>
                <td className="px-4 py-3 font-semibold text-green-600">FREE</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          A 5% tax is added to the subtotal at checkout. You always see the full price breakdown before paying.
        </p>
      </HelpCard>

      <HelpCard title="Delivery times">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className={`${tableClass} min-w-120`}>
            <thead>
              <tr>
                <th className={thClass}>Destination</th>
                <th className={thClass}>Covers</th>
                <th className={thClass}>Estimated delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DELIVERY_TIMES.map(([zone, covers, time]) => (
                <tr key={zone}>
                  <td className="px-4 py-3 font-medium text-gray-900">{zone}</td>
                  <td className="px-4 py-3 text-gray-600">{covers}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Orders are packed within 24 hours of payment. Follow every step on the{" "}
          <Link to="/track-order" className="font-semibold text-pink-600 hover:underline">
            Track Order
          </Link>{" "}
          page.
        </p>
      </HelpCard>

      <HelpCard title={`${RETURN_WINDOW_DAYS}-day easy returns`}>
        <p className="mb-5 text-sm text-gray-600">
          Changed your mind? Most items can be returned within {RETURN_WINDOW_DAYS} days of delivery — pickup is free.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RETURN_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-3 font-semibold text-gray-900">{step.title}</p>
              <p className="mt-1 text-sm text-gray-600">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Ban className="h-5 w-5 text-red-500" /> Not returnable
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {NON_RETURNABLE.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <PackageCheck className="h-5 w-5 text-green-600" /> Damaged or wrong item?
            </h3>
            <p className="text-sm text-gray-600">
              Tell us within 48 hours of delivery with a photo of the item and we'll send a free replacement or a full refund.
            </p>
          </div>
        </div>
      </HelpCard>

      <HelpCard title="Refund timelines">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Paid with</th>
                <th className={thClass}>Refund arrives in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {REFUND_TIMES.map(([method, time]) => (
                <tr key={method}>
                  <td className="px-4 py-3 text-gray-700">{method}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-gray-500">Timelines start after the returned item passes its quality check.</p>
      </HelpCard>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-pink-100 bg-pink-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">Want to return or exchange something?</p>
          <p className="text-sm text-gray-600">Send us your order ID and we'll schedule a free pickup.</p>
        </div>
        <Link to="/contact" className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700">
          Start a return
        </Link>
      </div>
    </div>
  </HelpLayout>
);

export default ShippingReturns;
