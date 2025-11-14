// utils/otp.ts
import crypto from 'crypto';
import { redis } from '../lib/redis';


const OTP_ENV_LENGTH = Number(process.env.OTP_CODE_LENGTH || 6);
const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 180); // default 3 min
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

/** Save hashed OTP with TTL */
export async function saveOtpToRedis(key: string, otp: string): Promise<void> {
  const redisKey = otpKey(key);
  const hashed = hashOtp(otp);
  await redis.set(redisKey, hashed, { ex: OTP_TTL_SECONDS });
  console.log(`✅ OTP saved to Redis: ${redisKey} (ttl ${OTP_TTL_SECONDS}s)`);
}

/** Get hashed OTP (internal use) */
export async function getOtpHashFromRedis(key: string): Promise<string | null> {
  const redisKey = otpKey(key);
  return (await redis.get<string | null>(redisKey)) ?? null;
}

/** Delete OTP key (one-time use) */
export async function deleteOtpFromRedis(key: string): Promise<boolean> {
  const redisKey = otpKey(key);
  try {
    const result = await redis.del(redisKey);
    return result > 0;
  } catch (err) {
    console.error(`Error deleting OTP for ${redisKey}`, err);
    return false;
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
