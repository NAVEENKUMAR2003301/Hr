import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { loginSchema } from "../validators/auth.validator.js";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, cookieOptions } from "../utils/tokens.js";

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
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
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

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return res.json({ user: null });
    }

    const payload = {
      id: user.id,
      role: user.role,
      employeeId: decoded.employeeId,
      mustChangePassword: user.mustChangePassword,
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
