import React from "react";
import { Loader2 } from "lucide-react";

// Shown while a lazily loaded page's code downloads
const PageLoader = ({ className = "min-h-[60vh]" }) => (
  <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
    <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
  </div>
);

export default PageLoader;
