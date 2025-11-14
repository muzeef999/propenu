import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function generateToken(payload : JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
