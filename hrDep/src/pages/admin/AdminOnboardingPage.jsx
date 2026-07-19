import AdminOnboardingTrackerPage from "./AdminOnboardingTrackerPage";
import AdminOnboardingTemplatesPage from "./AdminOnboardingTemplatesPage";

export default function AdminOnboardingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">Onboarding</h1>
        <AdminOnboardingTrackerPage />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Task Templates</h2>
        <AdminOnboardingTemplatesPage />
      </div>
    </div>
  );
}
