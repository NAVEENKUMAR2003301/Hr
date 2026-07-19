import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import LoadingScreen from "../components/LoadingScreen";

export default function ProtectedRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingScreen />;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
