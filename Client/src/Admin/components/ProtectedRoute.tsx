// src/Admin/components/ProtectedRoute.tsx

import type { JSX } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAdminAuthenticated =
    localStorage.getItem("adminKey") === import.meta.env.VITE_ADMIN_KEY;

  return isAdminAuthenticated ? children : <Navigate to="/admin" replace />;
};

export default ProtectedRoute;
