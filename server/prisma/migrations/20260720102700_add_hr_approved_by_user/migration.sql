-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "hrApprovedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_hrApprovedByUserId_fkey" FOREIGN KEY ("hrApprovedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

