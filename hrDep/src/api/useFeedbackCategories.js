import { createCrudHooks } from "./useCrud";

export const {
  useList: useFeedbackCategories,
  useCreate: useCreateFeedbackCategory,
  useUpdate: useUpdateFeedbackCategory,
  useRemove: useDeleteFeedbackCategory,
} = createCrudHooks("/feedback-categories", "feedbackCategories");
