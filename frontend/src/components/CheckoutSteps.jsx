import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Cart", to: "/cart" },
  { label: "Address & Payment", to: "/address" },
  { label: "Order placed" },
];

// Cart → Address & Payment → Order placed; finished steps link back
const CheckoutSteps = ({ current }) => (
  <ol className="mb-6 flex items-center justify-center gap-2 text-sm sm:gap-4">
    {STEPS.map((step, index) => {
      const done = index < current;
      const isCurrent = index === current;
      const content = (
        <>
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              done ? "bg-green-500 text-white" : isCurrent ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {done ? <Check className="h-4 w-4" /> : index + 1}
          </span>
          <span className={`hidden font-semibold sm:inline ${isCurrent ? "text-gray-900" : "text-gray-500"}`}>{step.label}</span>
        </>
      );
      return (
        <li key={step.label} className="flex items-center gap-2 sm:gap-4">
          {index > 0 && <span className={`h-0.5 w-8 sm:w-16 ${index <= current ? "bg-green-500" : "bg-gray-200"}`} />}
          {done && step.to ? (
            <Link to={step.to} className="flex items-center gap-2 hover:opacity-80">
              {content}
            </Link>
          ) : (
            <span className="flex items-center gap-2" aria-current={isCurrent ? "step" : undefined}>
              {content}
              {isCurrent && <span className="font-semibold text-gray-900 sm:hidden">{step.label}</span>}
            </span>
          )}
        </li>
      );
    })}
  </ol>
);

export default CheckoutSteps;
