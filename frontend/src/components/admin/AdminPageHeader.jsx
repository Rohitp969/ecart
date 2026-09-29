import React from "react";

const AdminPageHeader = ({ title, description, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold wrap-break-word text-gray-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm wrap-break-word text-gray-500">{description}</p>}
    </div>
    {/* actions get their own full-width row on phones */}
    {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{children}</div>}
  </div>
);

export default AdminPageHeader;
