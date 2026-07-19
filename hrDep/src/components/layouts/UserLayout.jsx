import { NavLink, Outlet } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../../features/theme/ThemeToggle";
import { useAuth } from "../../features/auth/useAuth";

const NAV_ITEMS = [
  { to: "/user", label: "Dashboard", end: true },
  { to: "/user/profile", label: "My Profile" },
  { to: "/user/leaves", label: "My Leaves" },
  { to: "/user/onboarding", label: "Onboarding" },
  { to: "/user/performance", label: "Performance" },
  { to: "/user/organization", label: "Org Chart" },
];

export default function UserLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-700 dark:text-indigo-300"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
