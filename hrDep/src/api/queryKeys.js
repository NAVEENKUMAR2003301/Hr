export const queryKeys = {
  me: ["me"],
  employees: (filters) => ["employees", filters],
  employee: (id) => ["employees", id],
  departments: ["departments"],
  myLeaves: ["leaves", "me"],
  leaveRequests: (filters) => ["leaves", filters],
  myOnboarding: ["onboarding", "me"],
  onboardingProcesses: ["onboarding"],
  reviewCycles: ["performance", "cycles"],
  myReviews: ["performance", "reviews", "me"],
};
