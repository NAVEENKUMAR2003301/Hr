import { createCrudHooks } from "./useCrud";

// Balances are auto-created server-side per policy/year — only list + correct (update) apply.
export const { useList: useLeaveBalances, useUpdate: useUpdateLeaveBalance } = createCrudHooks(
  "/leave-balances",
  "leaveBalances"
);
