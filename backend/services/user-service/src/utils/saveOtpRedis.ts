// utils/otp.ts
import crypto from 'crypto';
import { redis } from '../lib/redis';


const OTP_ENV_LENGTH = Number(process.env.OTP_CODE_LENGTH || 6);
const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300); // default 5 min
const OTP_HASH_SECRET = process.env.OTP_HASH_SECRET || 'dev-secret';

export function genOtp(length = OTP_ENV_LENGTH): string {
  const n = crypto.randomInt(0, 10 ** length);
  return String(n).padStart(length, '0');
}

function otpKey(key: string): string {
  // key can be email or phone — normalize if needed
  return `otp:${key}`;
}

function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', OTP_HASH_SECRET).update(otp).digest('hex');
}

/** Used when Upstash rejects writes (monthly command limit). */
const memoryOtps = new Map<string, { hash: string; expiresAt: number }>();

function rememberOtp(redisKey: string, hashed: string) {
  memoryOtps.set(redisKey, {
    hash: hashed,
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
  });
}

function readMemoryOtp(redisKey: string): string | null {
  const entry = memoryOtps.get(redisKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryOtps.delete(redisKey);
    return null;
  }
  return entry.hash;
}

/** Save hashed OTP with TTL */
export async function saveOtpToRedis(key: string, otp: string): Promise<void> {
  const redisKey = otpKey(key);
  const hashed = hashOtp(otp);
  if (key.includes("@")) {
    console.log(`📧 Email OTP for ${key}: ${otp}`);
  }
  try {
    await redis.set(redisKey, hashed, { ex: OTP_TTL_SECONDS });
    memoryOtps.delete(redisKey);
    console.log(`✅ OTP saved to Redis: ${redisKey} (ttl ${OTP_TTL_SECONDS}s)`);
  } catch (err) {
    rememberOtp(redisKey, hashed);
    console.warn(
      `⚠️ Redis OTP save failed. Kept in memory for ${OTP_TTL_SECONDS}s.`,
      err instanceof Error ? err.message : err,
    );
  }
}

/** Get hashed OTP (internal use) */
export async function getOtpHashFromRedis(key: string): Promise<string | null> {
  const redisKey = otpKey(key);
  const memoryHash = readMemoryOtp(redisKey);
  if (memoryHash) return memoryHash;
  try {
    return (await redis.get<string | null>(redisKey)) ?? null;
  } catch (err) {
    console.warn(
      `⚠️ Redis OTP read failed for ${redisKey}.`,
      err instanceof Error ? err.message : err,
    );
    return readMemoryOtp(redisKey);
  }
}

/** Delete OTP key (one-time use) */
export async function deleteOtpFromRedis(key: string): Promise<boolean> {
  const redisKey = otpKey(key);
  const hadMemory = memoryOtps.delete(redisKey);
  try {
    const result = await redis.del(redisKey);
    return result > 0 || hadMemory;
  } catch (err) {
    console.error(`Error deleting OTP for ${redisKey}`, err);
    return hadMemory;
  }
}

/** Verify a raw OTP against the stored hash; delete on success */
export async function verifyAndConsumeOtp(key: string, otp: string): Promise<boolean> {
  const stored = await getOtpHashFromRedis(key);
  if (!stored) return false;
  const ok = stored === hashOtp(otp);
  if (ok) await deleteOtpFromRedis(key); // one-time
  return ok;
}

export type OtpVerificationResult =
  | { valid: true }
  | { valid: false; reason: "expired" | "incorrect" };

/** Verify a raw OTP and explain why it failed; delete on success */
export async function verifyAndConsumeOtpWithReason(
  key: string,
  otp: string
): Promise<OtpVerificationResult> {
  const stored = await getOtpHashFromRedis(key);

  if (!stored) {
    return { valid: false, reason: "expired" };
  }

  const ok = stored === hashOtp(otp);

  if (!ok) {
    return { valid: false, reason: "incorrect" };
  }

  await deleteOtpFromRedis(key); // one-time
  return { valid: true };
}
