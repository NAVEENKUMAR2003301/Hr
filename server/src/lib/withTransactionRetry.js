import { prisma } from "./prisma.js";

const TRANSIENT_TRANSACTION_ERROR = /Transaction (not found|already closed|API error)/i;

// Neon's serverless compute can cold-start (or the pooler can recycle the
// underlying connection) mid multi-statement interactive transaction — most likely
// after the app has sat idle long enough for Neon's autosuspend to kick in. Prisma
// surfaces this as "Transaction not found" / "Transaction already closed" rather
// than a normal connection error, and it's been observed to succeed cleanly on a
// bare retry, so retry once instead of failing the whole user-facing action.
export async function withTransactionRetry(fn, options = { maxWait: 10000, timeout: 15000 }) {
  try {
    return await prisma.$transaction(fn, options);
  } catch (err) {
    if (TRANSIENT_TRANSACTION_ERROR.test(err.message ?? "")) {
      return prisma.$transaction(fn, options);
    }
    throw err;
  }
}
