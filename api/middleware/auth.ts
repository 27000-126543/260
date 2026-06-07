import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agriculture_secret_key_2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
    name: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      name: decoded.name,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token无效或已过期' });
  }
}

export function generateToken(user: { id: string; phone: string; name: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '30d' });
}
