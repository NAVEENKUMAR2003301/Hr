-- AlterTable
ALTER TABLE "OnboardingProcess" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "hrRoundCleared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referral" TEXT,
ADD COLUMN     "selectionMailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "technicalRoundCleared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trainingStipend" BOOLEAN NOT NULL DEFAULT false;

