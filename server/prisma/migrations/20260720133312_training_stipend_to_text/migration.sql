-- AlterTable
ALTER TABLE "OnboardingProcess" ALTER COLUMN "trainingStipend" DROP NOT NULL,
ALTER COLUMN "trainingStipend" DROP DEFAULT,
ALTER COLUMN "trainingStipend" SET DATA TYPE TEXT;

