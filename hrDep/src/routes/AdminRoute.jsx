import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

export default function AdminRoute() {
  const { user } = useAuth();

  if (!["ADMIN", "MANAGER"].includes(user?.role)) {
    return <Navigate to="/user" replace />;
  }
  return <Outlet />;
}
