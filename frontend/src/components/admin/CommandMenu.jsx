import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, ExternalLink, Home, Images, Inbox, Package, PackagePlus, PackageX, Search, ShoppingBag, SlidersHorizontal, TicketPercent, Truck, UserCog, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const COMMANDS = [
  { label: "Dashboard", hint: "Sales and what needs attention", icon: Home, to: "/admin" },
  { label: "Orders", hint: "All orders", icon: ShoppingBag, to: "/admin/orders" },
  { label: "Orders to ship", hint: "Confirmed, not shipped yet", icon: Truck, to: "/admin/orders?view=to-ship" },
  { label: "Products", hint: "Catalog, prices and stock", icon: Package, to: "/admin/products" },
  { label: "Add product", hint: "Create a new listing", icon: PackagePlus, to: "/admin/products/new" },
  { label: "Low and out of stock", hint: "Products to restock", icon: PackageX, to: "/admin/products?stock=low" },
  { label: "Users", hint: "Customers and their orders", icon: Users, to: "/admin/customers" },
  { label: "Messages", hint: "Contact messages and subscribers", icon: Inbox, to: "/admin/messages" },
  { label: "Coupons", hint: "Discount codes for checkout", icon: TicketPercent, to: "/admin/coupons" },
  { label: "Banners", hint: "Home page slides and promo cards", icon: Images, to: "/admin/banners" },
  { label: "Store settings", hint: "Shipping charge, tax, COD, contact details", icon: SlidersHorizontal, to: "/admin/settings" },
  { label: "My profile", hint: "Your profile and password", icon: UserCog, to: "/admin/account" },
  { label: "Open store", hint: "In a new tab", icon: ExternalLink, href: "/" },
];

// Ctrl/⌘ K: jump to any part of the console from the keyboard
const CommandMenu = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    // matches in the name first, then matches in the description
    const inLabel = (c) => c.label.toLowerCase().includes(q);
    return COMMANDS.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q)).sort((a, b) => inLabel(b) - inLabel(a));
  }, [query]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setActive(0);
  };

  const run = (command) => {
    if (!command) return;
    close();
    if (command.href) window.open(command.href, "_blank", "noreferrer");
    else navigate(command.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent showCloseButton={false} className="top-[15%] w-[calc(100vw-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Jump to</DialogTitle>
        <DialogDescription className="sr-only">Type to filter, use the arrow keys to choose and Enter to open.</DialogDescription>
        <div className="flex items-center gap-2 border-b border-gray-200 px-4">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page or action"
            aria-label="Jump to a page or action"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={results[active] ? `command-${active}` : undefined}
            className="h-12 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>
        <ul id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-gray-500">Nothing matches “{query}”.</li>
          ) : (
            results.map((command, index) => (
              <li
                key={command.label}
                id={`command-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseMove={() => setActive(index)}
                onClick={() => run(command)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${index === active ? "bg-pink-50" : ""}`}
              >
                <command.icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{command.label}</span>
                  <span className="block truncate text-xs text-gray-500">{command.hint}</span>
                </span>
                {index === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default CommandMenu;
