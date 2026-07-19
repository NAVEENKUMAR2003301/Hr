-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'PATERNITY');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED_BY_MANAGER', 'APPROVED_BY_HR', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingCategory" AS ENUM ('DOCUMENT', 'IT_SETUP', 'TRAINING');

-- CreateEnum
CREATE TYPE "OnboardingProcessStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'DELAYED');

-- CreateEnum
CREATE TYPE "OnboardingTaskStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReviewCycleType" AS ENUM ('QUARTERLY', 'ANNUAL', 'PROBATION');

-- CreateEnum
CREATE TYPE "ReviewCycleStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('SELF_APPRAISAL_PENDING', 'MANAGER_REVIEW_PENDING', 'ACKNOWLEDGED', 'DISPUTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "refreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "personalEmail" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactNumber" TEXT,
    "profilePictureUrl" TEXT,
    "departmentId" TEXT,
    "designationId" TEXT,
    "managerId" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "headEmployeeId" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "maxDaysPerYear" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leavePolicyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "pendingDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leavePolicyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "managerApprovalId" TEXT,
    "managerComment" TEXT,
    "hrApprovalId" TEXT,
    "hrComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTaskTemplate" (
    "id" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "category" "OnboardingCategory" NOT NULL,
    "assignedRole" "Role" NOT NULL DEFAULT 'ADMIN',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OnboardingTaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProcess" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "hrAssignedId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetEndDate" TIMESTAMP(3),
    "status" "OnboardingProcessStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "OnboardingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTaskItem" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "OnboardingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "fileUploadUrl" TEXT,

    CONSTRAINT "OnboardingTaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "ReviewCycleType" NOT NULL,
    "status" "ReviewCycleStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'SELF_APPRAISAL_PENDING',

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FeedbackCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRating" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "selfRating" INTEGER,
    "managerRating" INTEGER,
    "comment" TEXT,

    CONSTRAINT "ReviewRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_headEmployeeId_key" ON "Department"("headEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_leaveType_key" ON "LeavePolicy"("leaveType");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leavePolicyId_year_key" ON "LeaveBalance"("employeeId", "leavePolicyId", "year");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProcess_employeeId_key" ON "OnboardingProcess"("employeeId");

-- CreateIndex
CREATE INDEX "OnboardingTaskItem_processId_idx" ON "OnboardingTaskItem"("processId");

-- CreateIndex
CREATE INDEX "Review_cycleId_idx" ON "Review"("cycleId");

-- CreateIndex
CREATE INDEX "Review_employeeId_idx" ON "Review"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackCategory_name_key" ON "FeedbackCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRating_reviewId_categoryId_key" ON "ReviewRating"("reviewId", "categoryId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headEmployeeId_fkey" FOREIGN KEY ("headEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "LeavePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "LeavePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_managerApprovalId_fkey" FOREIGN KEY ("managerApprovalId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_hrApprovalId_fkey" FOREIGN KEY ("hrApprovalId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProcess" ADD CONSTRAINT "OnboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProcess" ADD CONSTRAINT "OnboardingProcess_hrAssignedId_fkey" FOREIGN KEY ("hrAssignedId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTaskItem" ADD CONSTRAINT "OnboardingTaskItem_processId_fkey" FOREIGN KEY ("processId") REFERENCES "OnboardingProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTaskItem" ADD CONSTRAINT "OnboardingTaskItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTaskTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRating" ADD CONSTRAINT "ReviewRating_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRating" ADD CONSTRAINT "ReviewRating_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedbackCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
