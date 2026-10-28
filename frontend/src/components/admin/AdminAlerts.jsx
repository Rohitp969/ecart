import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_URL, authConfig } from "@/lib/admin";
import { AdminAlertsContext } from "@/lib/adminAlerts";

const STALE_AFTER_MS = 30 * 1000;

// Loads the console's alert counts (see lib/adminAlerts.js) and shares them with every admin page
const AdminAlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState(null);
  const { pathname } = useLocation();
  const lastFetchedAt = useRef(0);

  const refreshAlerts = useCallback(() => {
    lastFetchedAt.current = Date.now();
    axios
      .get(`${API_URL}/api/v1/orders/alerts`, authConfig())
      .then((res) => res.data.success && setAlerts(res.data.alerts))
      .catch(() => {
        // an API without this endpoint yet: the console just shows no badges
      });
  }, []);

  // refetch on navigation, at most every 30s
  useEffect(() => {
    if (Date.now() - lastFetchedAt.current > STALE_AFTER_MS) refreshAlerts();
  }, [pathname, refreshAlerts]);

  return <AdminAlertsContext.Provider value={{ alerts, refreshAlerts }}>{children}</AdminAlertsContext.Provider>;
};

export default AdminAlertsProvider;
