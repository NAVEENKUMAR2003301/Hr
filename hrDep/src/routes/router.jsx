import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import AdminLayout from "../components/layouts/AdminLayout";
import UserLayout from "../components/layouts/UserLayout";

import LoginPage from "../features/auth/LoginPage";
import SignUpPage from "../features/auth/SignUpPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
import ChangePasswordPage from "../features/auth/ChangePasswordPage";
import AdminActivityLogPage from "../pages/admin/AdminActivityLogPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminEmployeesPage from "../pages/admin/AdminEmployeesPage";
import AdminEmployeeAddPage from "../pages/admin/AdminEmployeeAddPage";
import AdminEmployeeEditPage from "../pages/admin/AdminEmployeeEditPage";
import AdminEmployeeDetailPage from "../pages/admin/AdminEmployeeDetailPage";
import AdminIdCardsPage from "../pages/admin/AdminIdCardsPage";
import AdminDepartmentsPage from "../pages/admin/AdminDepartmentsPage";
import AdminDepartmentDetailPage from "../pages/admin/AdminDepartmentDetailPage";
import AdminLeavesPage from "../pages/admin/AdminLeavesPage";
import AdminOnboardingPage from "../pages/admin/AdminOnboardingPage";
import AdminPerformancePage from "../pages/admin/AdminPerformancePage";

import UserDashboardPage from "../pages/user/UserDashboardPage";
import UserProfilePage from "../pages/user/UserProfilePage";
import UserLeavesPage from "../pages/user/UserLeavesPage";
import UserOnboardingPage from "../pages/user/UserOnboardingPage";
import UserPerformancePage from "../pages/user/UserPerformancePage";
import UserOrganizationPage from "../pages/user/UserOrganizationPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "employees", element: <AdminEmployeesPage /> },
              { path: "employees/add", element: <AdminEmployeeAddPage /> },
              { path: "employees/:id", element: <AdminEmployeeDetailPage /> },
              { path: "employees/:id/edit", element: <AdminEmployeeEditPage /> },
              { path: "id-cards", element: <AdminIdCardsPage /> },
              { path: "activity-log", element: <AdminActivityLogPage /> },
              { path: "departments", element: <AdminDepartmentsPage /> },
              { path: "departments/:id", element: <AdminDepartmentDetailPage /> },
              { path: "leaves/*", element: <AdminLeavesPage /> },
              { path: "onboarding/*", element: <AdminOnboardingPage /> },
              { path: "performance/*", element: <AdminPerformancePage /> },
            ],
          },
        ],
      },
      {
        path: "/user",
        element: <UserLayout />,
        children: [
          { index: true, element: <UserDashboardPage /> },
          { path: "profile", element: <UserProfilePage /> },
          { path: "leaves/*", element: <UserLeavesPage /> },
          { path: "onboarding", element: <UserOnboardingPage /> },
          { path: "performance", element: <UserPerformancePage /> },
          { path: "organization", element: <UserOrganizationPage /> },
        ],
      },
      { path: "/", element: <Navigate to="/user" replace /> },
    ],
  },
]);
