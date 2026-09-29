// Role-based routing rules, shared by login, route guards and the navbar

export const isAdmin = (user) => user?.role === "admin";

const ADMIN_AREA = "/dashboard";

// After login: go back to the page that asked for it when this user may open it,
// otherwise to their home. Admins always land inside the admin panel.
export const redirectAfterLogin = (user, from) => {
  const target = typeof from === "string" && from.startsWith("/") && !from.startsWith("/login") ? from : null;
  if (isAdmin(user)) return target?.startsWith(ADMIN_AREA) ? target : ADMIN_AREA;
  return target && !target.startsWith(ADMIN_AREA) ? target : "/";
};
