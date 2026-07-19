import { createCrudHooks } from "./useCrud";

// Balances are auto-created server-side per policy/year — list, correct (update),
// and reset (remove — only allowed with nothing used/pending; the row comes back
// fresh next time this employee's balances are viewed).
export const {
  useList: useLeaveBalances,
  useUpdate: useUpdateLeaveBalance,
  useRemove: useDeleteLeaveBalance,
} = createCrudHooks("/leave-balances", "leaveBalances");
