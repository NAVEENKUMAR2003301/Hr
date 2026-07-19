import { createCrudHooks } from "./useCrud";

export const {
  useList: useOnboardingTemplates,
  useCreate: useCreateOnboardingTemplate,
  useUpdate: useUpdateOnboardingTemplate,
  useRemove: useDeleteOnboardingTemplate,
} = createCrudHooks("/onboarding-templates", "onboardingTemplates");
