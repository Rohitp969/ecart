import { createContext, useContext } from "react";

// Work waiting for the admin (orders to ship, new messages, stock), shown as sidebar badges,
// the notifications menu and the dashboard queue. Pages call refreshAlerts() after changing any of it.
// The provider lives in components/admin/AdminAlerts.jsx.
export const AdminAlertsContext = createContext({ alerts: null, refreshAlerts: () => {} });

export const useAdminAlerts = () => useContext(AdminAlertsContext);

// Queue items in priority order; `count` is null until the alerts have loaded, label(n) follows the count
export const alertItems = (alerts) => [
  {
    key: "toShip",
    count: alerts?.toShip ?? null,
    label: (n) => (n === 1 ? "order to ship" : "orders to ship"),
    detail: "Confirmed and waiting to be packed",
    action: "Ship orders",
    to: "/admin/orders?view=to-ship",
  },
  {
    key: "newMessages",
    count: alerts?.newMessages ?? null,
    label: (n) => (n === 1 ? "new message" : "new messages"),
    detail: "Customers waiting for a reply",
    action: "Open inbox",
    to: "/admin/messages?status=New",
  },
  {
    key: "outOfStock",
    count: alerts?.outOfStock ?? null,
    label: (n) => (n === 1 ? "product out of stock" : "products out of stock"),
    detail: "Customers can't buy these until restocked",
    action: "Restock",
    to: "/admin/products?stock=out",
  },
  {
    key: "lowStock",
    count: alerts?.lowStock ?? null,
    label: (n) => (n === 1 ? "product running low" : "products running low"),
    detail: "10 units or fewer left",
    action: "Review stock",
    to: "/admin/products?stock=low",
  },
];
