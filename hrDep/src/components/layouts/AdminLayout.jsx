import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../Logo";
import ThemeToggle from "../../features/theme/ThemeToggle";
import { useAuth } from "../../features/auth/useAuth";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/employees", label: "Employees" },
  { to: "/admin/id-cards", label: "ID Cards" },
  { to: "/admin/departments", label: "Departments" },
  { to: "/admin/leaves", label: "Leaves" },
  { to: "/admin/onboarding", label: "Onboarding" },
  { to: "/admin/activity-log", label: "Activity Log" },
];

function SidebarContent({ user, logout, onNavigate }) {
  return (
    <>
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{user?.role}</span>
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes — adjusted during render
  // (React's recommended pattern for "state derived from a changing prop/value")
  // rather than in an effect, which would cost an extra render pass.
  const [lastPathname, setLastPathname] = useState(location.pathname);
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:flex">
      {/* Mobile top bar — only visible below the lg breakpoint */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Logo size="sm" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 flex flex-col shadow-xl">
            <SidebarContent user={user} logout={logout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Permanent sidebar on lg+ screens */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col">
        <SidebarContent user={user} logout={logout} />
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
