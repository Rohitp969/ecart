import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import React from "react";

const FEATURES = [
  { icon: Truck, title: "Free Delivery", text: "On orders above ₹299", color: "bg-blue-50 text-blue-600" },
  { icon: ShieldCheck, title: "Secure Payments", text: "100% safe with Razorpay", color: "bg-green-50 text-green-600" },
  { icon: RotateCcw, title: "Easy Returns", text: "30-day hassle-free returns", color: "bg-amber-50 text-amber-600" },
  { icon: Headphones, title: "24/7 Support", text: "Always here to help", color: "bg-purple-50 text-purple-600" },
];

const Features = () => {
  return (
    <section className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-4">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${feature.color}`}>
            <feature.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">{feature.title}</h3>
            <p className="text-xs text-gray-500 sm:text-sm">{feature.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Features;
