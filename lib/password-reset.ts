import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60_000; // 1 hour

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Creates a new reset token for the given user, invalidating any token
 * previously issued to them. Returns the RAW token — this is the only
 * moment it exists outside the email link, so the caller must send it
 * immediately and never persist it themselves.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");

  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Validates a raw token from a reset link. Returns the associated userId
 * if valid, or null if the token is missing, expired, or already used.
 * Does NOT consume the token — call consumePasswordResetToken once the
 * new password has actually been set.
 */
export async function verifyPasswordResetToken(rawToken: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }
  return record.userId;
}

/** Single-use enforcement — call after the password has been updated. */
export async function consumePasswordResetToken(rawToken: string): Promise<void> {
  await prisma.passwordResetToken
    .delete({ where: { tokenHash: hashToken(rawToken) } })
    .catch(() => {});
}
