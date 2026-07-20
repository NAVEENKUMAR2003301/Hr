-- AlterTable
ALTER TABLE "OnboardingProcess" DROP COLUMN "domain",
DROP COLUMN "hrRoundCleared",
DROP COLUMN "referral",
DROP COLUMN "technicalRoundCleared",
ADD COLUMN     "currentCtc" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "docUpdates" TEXT,
ADD COLUMN     "expectedCtc" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "forReference" TEXT,
ADD COLUMN     "hrRound" TEXT,
ADD COLUMN     "liveProject" TEXT,
ADD COLUMN     "relevantExperience" TEXT,
ADD COLUMN     "technicalRound" TEXT,
ADD COLUMN     "trainingKt" TEXT,
ADD COLUMN     "trainingStatus" TEXT;

