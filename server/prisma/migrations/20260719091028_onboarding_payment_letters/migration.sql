-- CreateEnum
CREATE TYPE "OnboardingPaymentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "OnboardingProcess"
  ADD COLUMN "paymentStatus" "OnboardingPaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "offerLetterSentAt" TIMESTAMP(3),
  ADD COLUMN "appointmentLetterSentAt" TIMESTAMP(3);
