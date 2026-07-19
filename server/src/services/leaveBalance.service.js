// For a monthly-accrual policy (e.g. 2 days/month Casual or Sick), the entitlement
// for `year` grows as the calendar year progresses — there's no cron job in this app,
// so instead each read/write of the balance recomputes "how much should have accrued
// by now" and self-heals the stored totalDays up to that figure. Past years are fully
// accrued (12 months); future years haven't started accruing yet.
function accruedTotalDays(policy, year) {
  if (!policy.accrualPerMonth) return policy.maxDaysPerYear;

  const now = new Date();
  const currentYear = now.getFullYear();
  const monthsElapsed = year < currentYear ? 12 : year > currentYear ? 0 : now.getMonth() + 1;

  return Math.min(policy.accrualPerMonth * monthsElapsed, policy.maxDaysPerYear);
}

// Creates one LeaveBalance row per active LeavePolicy for employeeId/year, seeded
// from each policy's default (or accrued-so-far amount), for any policy that doesn't
// already have a row — and tops up existing accrual-based rows as months pass.
// Shared by employee creation (so a new hire can apply for leave on day one) and
// the admin balances view (so viewing an older year still fills in any gaps).
export async function ensureLeaveBalances(tx, employeeId, year) {
  const policies = await tx.leavePolicy.findMany();
  const existing = await tx.leaveBalance.findMany({ where: { employeeId, year } });
  const existingByPolicy = new Map(existing.map((b) => [b.leavePolicyId, b]));

  const missing = policies.filter((p) => !existingByPolicy.has(p.id));
  if (missing.length > 0) {
    await tx.leaveBalance.createMany({
      data: missing.map((p) => ({ employeeId, leavePolicyId: p.id, year, totalDays: accruedTotalDays(p, year) })),
      skipDuplicates: true,
    });
  }

  for (const policy of policies) {
    if (!policy.accrualPerMonth) continue;
    const balance = existingByPolicy.get(policy.id);
    if (!balance) continue;

    const target = accruedTotalDays(policy, year);
    if (target > balance.totalDays) {
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { totalDays: target } });
    }
  }
}
