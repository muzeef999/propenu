// utils/otp.js
import crypto from 'crypto';

export function genOtp() {
  const OTP_CODE_LENGTH = Number(process.env.OTP_CODE_LENGTH) || 4; 
  const n = crypto.randomInt(0, 10 ** OTP_CODE_LENGTH);
  return String(n).padStart(OTP_CODE_LENGTH, '0');
}
