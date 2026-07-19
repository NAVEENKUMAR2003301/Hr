import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, cookieOptions } from "../utils/tokens.js";
import { sendEmail } from "../services/email.service.js";
import { passwordResetEmail } from "../services/emailTemplates.js";
import { recordAudit } from "../services/auditLog.service.js";

// Employee-linked users (most logins) show their employee name; HR-only accounts
// created via sign-up have no Employee row, so fall back to User.name.
function resolveDisplayName(user) {
  if (user.employee) return `${user.employee.firstName} ${user.employee.lastName}`;
  return user.name ?? null;
}

// Plain !== is a timing side-channel on a shared secret — an attacker measuring
// response time could infer how many leading characters of their guess matched.
// Low real-world risk for a low-value office passphrase, but the fix is free.
function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths rather than just returning
  // false, and comparing against a same-length buffer of zeros first keeps the
  // length check itself from being a length-revealing early exit.
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Gated by a shared secret (HR_SIGNUP_CODE) rather than open — every HR sign-up
// gets full admin access to every employee's data, so this can't be a public form.
// The code is a simple shared passphrase your office gives out to HR staff, not a
// per-person invite; it's deliberately low-ceremony since this app has ~10 trusted
// coworkers, not an open userbase.
export async function signup(req, res, next) {
  try {
    const { name, email, password, signupCode } = signupSchema.parse(req.body);

    if (!process.env.HR_SIGNUP_CODE) {
      return res.status(503).json({ error: "Sign-up is not enabled (HR_SIGNUP_CODE is not configured on the server)" });
    }
    if (!timingSafeEqualStrings(signupCode, process.env.HR_SIGNUP_CODE)) {
      return res.status(403).json({ error: "Invalid sign-up code" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "ADMIN", mustChangePassword: false },
    });

    await recordAudit({
      userId: user.id,
      action: "auth.signup",
      entityType: "User",
      entityId: user.id,
      summary: `${name} (${email}) signed up as a new HR admin`,
    });

    const payload = { id: user.id, role: user.role, employeeId: null, mustChangePassword: false, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res
      .status(201)
      .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ user: payload });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "An account with that email already exists" });
    next(err);
  }
}

// Always returns the exact same response — same shape, same fields, no
// distinguishing detail — regardless of whether the email matches an account or
// whether the send succeeded. Earlier this endpoint also returned emailSent/
// emailError, which (even with an identical `message`) let a caller tell "no
// such account" apart from "account exists" just by checking which keys were
// present in the JSON. Whether the email actually went out is now only visible
// to admins, via the audit log — never to the unauthenticated caller.
export async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const genericResponse = { message: "If an account with that email exists, a reset link has been sent." };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
    const { subject, html } = passwordResetEmail({ name: user.name, resetUrl });
    const result = await sendEmail({ to: user.email, subject, html });

    await recordAudit({
      userId: user.id,
      action: "auth.forgotPassword",
      entityType: "User",
      entityId: user.id,
      summary: `Password reset requested for ${user.email} (email ${result.sent ? "sent" : `not sent: ${result.reason}`})`,
    });

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: hashedToken, passwordResetExpiresAt: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: "That reset link is invalid or has expired" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        refreshToken: null, // reset forces a fresh login everywhere, same as a security-relevant password change should
      },
    });

    res.json({ message: "Password reset — you can now log in with your new password." });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const payload = {
      id: user.id,
      role: user.role,
      employeeId: user.employee?.id ?? null,
      mustChangePassword: user.mustChangePassword,
      name: resolveDisplayName(user),
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res
      .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ user: payload });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Re-read mustChangePassword from the DB rather than trusting the stale
    // refresh-token claim, so a change made mid-session takes effect immediately.
    const payload = {
      id: user.id,
      role: user.role,
      employeeId: decoded.employeeId,
      mustChangePassword: user.mustChangePassword,
      name: resolveDisplayName(user),
    };
    const accessToken = signAccessToken(payload);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }).json({ user: payload });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user?.id) {
      await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
    }
    res.clearCookie("accessToken", cookieOptions).clearCookie("refreshToken", cookieOptions).status(204).end();
  } catch (err) {
    next(err);
  }
}

// Session bootstrap check — used on every page load to answer "am I logged in?".
// Unlike other protected routes, this one never 401s: an unauthenticated visitor
// asking "do I have a session?" is a normal state, not an error, and surfacing it
// as an HTTP error status just produces console noise for something the client
// already treats as "user: null" either way. If the access token is expired but
// the refresh token is still valid, it transparently rotates both tokens here
// instead of making the client catch a 401 and fire a second request.
export async function me(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;
    if (accessToken) {
      try {
        return res.json({ user: verifyAccessToken(accessToken) });
      } catch {
        // expired or invalid — fall through and try the refresh token
      }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.json({ user: null });

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.json({ user: null });
    }

    const payload = {
      id: user.id,
      role: user.role,
      employeeId: decoded.employeeId,
      mustChangePassword: user.mustChangePassword,
      name: resolveDisplayName(user),
    };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    res
      .cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ user: payload });
  } catch (err) {
    next(err);
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    });

    // Re-issue both tokens so the mustChangePassword claim flips immediately,
    // without forcing the user to log in again.
    const payload = { id: user.id, role: user.role, employeeId: req.user.employeeId, mustChangePassword: false };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res
      .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .json({ user: payload });
  } catch (err) {
    next(err);
  }
}
