import { createCrudHooks } from "./useCrud";

export const {
  useList: useLeavePolicies,
  useCreate: useCreateLeavePolicy,
  useUpdate: useUpdateLeavePolicy,
  useRemove: useDeleteLeavePolicy,
} = createCrudHooks("/leave-policies", "leavePolicies");
