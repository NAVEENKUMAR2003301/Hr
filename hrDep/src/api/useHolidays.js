import { createCrudHooks } from "./useCrud";

export const {
  useList: useHolidays,
  useCreate: useCreateHoliday,
  useRemove: useDeleteHoliday,
} = createCrudHooks("/holidays", "holidays");
