import { prisma } from "../lib/prisma.js";

const RECENT_LIMIT = 5;
const ACTIVITY_LIMIT = 10;

export async function summary(req, res, next) {
  try {
    const [
      totalEmployees,
      pendingLeaveCount,
      activeOnboardingCount,
      departmentCount,
      recentEmployees,
      recentLeaves,
      recentCompletedTasks,
    ] = await Promise.all([
      // Matches the directory's default view (employee.service.js listEmployees),
      // which hides TERMINATED employees unless explicitly requested.
      prisma.employee.count({ where: { employmentStatus: { not: "TERMINATED" } } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.onboardingProcess.count({ where: { status: "IN_PROGRESS" } }),
      prisma.department.count(),
      prisma.employee.findMany({
        take: RECENT_LIMIT,
        orderBy: { createdAt: "desc" },
        include: { department: true, designation: true },
      }),
      prisma.leaveRequest.findMany({
        take: RECENT_LIMIT,
        orderBy: { createdAt: "desc" },
        include: { employee: true, leavePolicy: true },
      }),
      prisma.onboardingTaskItem.findMany({
        take: RECENT_LIMIT,
        where: { status: "COMPLETED", completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        include: { template: true, process: { include: { employee: true } } },
      }),
    ]);

    const activity = [
      ...recentEmployees.map((e) => ({
        type: "employee_added",
        at: e.createdAt,
        message: `${e.firstName} ${e.lastName} joined${e.department ? ` — ${e.department.name}` : ""}`,
        employeeId: e.id,
      })),
      ...recentLeaves.map((l) => ({
        type: "leave_requested",
        at: l.createdAt,
        message: `${l.employee.firstName} ${l.employee.lastName} requested ${l.leavePolicy.leaveType} leave`,
        status: l.status,
        employeeId: l.employeeId,
      })),
      ...recentCompletedTasks.map((t) => ({
        type: "onboarding_task_completed",
        at: t.completedAt,
        message: `${t.process.employee.firstName} ${t.process.employee.lastName} completed "${t.template.taskName}"`,
        employeeId: t.process.employeeId,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, ACTIVITY_LIMIT);

    res.json({
      stats: {
        totalEmployees,
        pendingLeaveCount,
        activeOnboardingCount,
        departmentCount,
      },
      recentEmployees,
      recentLeaves,
      activity,
    });
  } catch (err) {
    next(err);
  }
}
