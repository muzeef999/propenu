import jwt from 'jsonwebtoken';
import { JwtUserPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateToken(payload : JwtUserPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
 