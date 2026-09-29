import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Footprints, Ruler, Shirt } from "lucide-react";
import HelpLayout, { HelpCard } from "@/components/HelpLayout";

// Measurements are body sizes. `base` is the unit the numbers are written in; columns from
// `measureFrom` onwards are measurements (converted by the in/cm toggle), earlier ones are labels.
const CHARTS = [
  {
    key: "men",
    label: "Men",
    icon: Shirt,
    tables: [
      {
        title: "Shirts, T-shirts & Jackets",
        base: "in",
        measureFrom: 1,
        columns: ["Size", "Chest", "Shoulder", "Length"],
        rows: [
          ["S", [36, 38], 17, 27],
          ["M", [38, 40], 17.5, 28],
          ["L", [40, 42], 18, 29],
          ["XL", [42, 44], 18.5, 30],
          ["XXL", [44, 46], 19, 31],
        ],
      },
      {
        title: "Jeans & Trousers",
        base: "in",
        measureFrom: 1,
        columns: ["Size", "Waist", "Hip", "Inseam"],
        rows: [
          ["28", 28, 36, 30],
          ["30", 30, 38, 30],
          ["32", 32, 40, 31],
          ["34", 34, 42, 31],
          ["36", 36, 44, 32],
        ],
      },
    ],
  },
  {
    key: "women",
    label: "Women",
    icon: Shirt,
    tables: [
      {
        title: "Tops, Dresses & Kurtas",
        base: "in",
        measureFrom: 1,
        columns: ["Size", "Bust", "Waist", "Hip"],
        rows: [
          ["XS", 32, 26, 35],
          ["S", 34, 28, 37],
          ["M", 36, 30, 39],
          ["L", 38, 32, 41],
          ["XL", 40, 34, 43],
          ["XXL", 42, 36, 45],
        ],
      },
      {
        title: "Jeans & Trousers",
        base: "in",
        measureFrom: 1,
        columns: ["Size", "Waist", "Hip", "Inseam"],
        rows: [
          ["26", 26, 36, 29],
          ["28", 28, 38, 29],
          ["30", 30, 40, 30],
          ["32", 32, 42, 30],
          ["34", 34, 44, 31],
        ],
      },
    ],
  },
  {
    key: "footwear",
    label: "Footwear",
    icon: Footprints,
    tables: [
      {
        title: "Shoe sizes",
        base: "cm",
        measureFrom: 4,
        columns: ["UK / India", "US Men", "US Women", "EU", "Foot length"],
        rows: [
          ["3", "—", "5", "36", 22.0],
          ["4", "—", "6", "37", 22.9],
          ["5", "6", "7", "38", 23.7],
          ["6", "7", "8", "39", 24.6],
          ["7", "8", "9", "41", 25.4],
          ["8", "9", "10", "42", 26.2],
          ["9", "10", "—", "43", 27.1],
          ["10", "11", "—", "44", 27.9],
          ["11", "12", "—", "45", 28.8],
        ],
      },
    ],
  },
];

const HOW_TO_MEASURE = [
  { title: "Chest / Bust", text: "Measure around the fullest part, keeping the tape under your arms and level." },
  { title: "Waist", text: "Measure around your natural waistline, just above the belly button." },
  { title: "Hip", text: "Stand with feet together and measure around the widest part of your hips." },
  { title: "Inseam", text: "Measure from the top of your inner thigh down to your ankle." },
  { title: "Foot length", text: "Stand on paper, mark heel and longest toe, and measure the distance between them." },
];

const convert = (value, base, unit) => (base === unit ? value : base === "in" ? value * 2.54 : value / 2.54);
const round = (value) => String(Math.round(value * 10) / 10);
const formatMeasure = (value, base, unit) =>
  Array.isArray(value) ? value.map((v) => round(convert(v, base, unit))).join("–") : round(convert(value, base, unit));

const SizeGuide = () => {
  const [chartKey, setChartKey] = useState("men");
  const [unit, setUnit] = useState("in");
  const chart = CHARTS.find((c) => c.key === chartKey);

  const toggleClass = (active) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
      active ? "bg-white text-pink-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <HelpLayout title="Size Guide" description="Find your perfect fit. All measurements are body measurements." icon={Ruler}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Size chart" className="inline-flex rounded-xl bg-gray-100 p-1">
            {CHARTS.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={c.key === chartKey}
                onClick={() => setChartKey(c.key)}
                className={toggleClass(c.key === chartKey)}
              >
                <c.icon className="h-4 w-4" />
                {c.label}
              </button>
            ))}
          </div>
          <div aria-label="Units" className="inline-flex rounded-xl bg-gray-100 p-1">
            {[
              ["in", "Inches"],
              ["cm", "Centimetres"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={unit === value}
                onClick={() => setUnit(value)}
                className={toggleClass(unit === value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {chart.tables.map((table) => (
          <HelpCard key={table.title} title={table.title}>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-105 text-center text-sm">
                <thead>
                  <tr>
                    {table.columns.map((column, index) => (
                      <th key={column} className="bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {column}
                        {index >= table.measureFrom && <span className="ml-1 normal-case text-gray-400">({unit})</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.rows.map((row) => (
                    <tr key={row[0]} className="hover:bg-pink-50/50">
                      {row.map((cell, index) => (
                        <td
                          key={index}
                          className={`px-4 py-3 tabular-nums ${index === 0 ? "font-bold text-gray-900" : "text-gray-700"}`}
                        >
                          {index >= table.measureFrom ? formatMeasure(cell, table.base, unit) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HelpCard>
        ))}

        <HelpCard title="How to measure">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {HOW_TO_MEASURE.map((tip) => (
              <div key={tip.title} className="rounded-xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">{tip.title}</p>
                <p className="mt-1 text-sm text-gray-600">{tip.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Between two sizes? Pick the larger one for a relaxed fit. Sizes can vary slightly between brands, so check the
            product description too. Still unsure?{" "}
            <Link to="/contact" className="font-semibold text-pink-600 hover:underline">
              Ask us
            </Link>
            .
          </p>
        </HelpCard>
      </div>
    </HelpLayout>
  );
};

export default SizeGuide;
