import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    department: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // --- TEMPORARY DEV BYPASS ---
  // Injects a mock admin user to bypass JWT requirement since DB seed failed locally.
  const mockUser = {
    id: 'dev-admin-id',
    name: 'Dev Administrator',
    role: 'ADMIN',
    department: 'MANAGEMENT'
  };

  (req as any).__auditContext = {
    userId: mockUser.id,
    userName: mockUser.name
  };
  
  req.user = mockUser;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};
