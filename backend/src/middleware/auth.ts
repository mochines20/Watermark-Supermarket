import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
    role: string;
    department: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // DEV_BYPASS is only allowed in development environment with strict validation
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS === 'true') {
    const mockUser = {
      id: 'dev-admin-id',
      name: 'Dev Administrator',
      email: 'dev@watermark.local',
      role: 'ADMIN',
      department: 'MANAGEMENT'
    };

    (req as any).__auditContext = {
      userId: mockUser.id,
      userName: mockUser.name
    };
    
    req.user = mockUser;
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      department: decoded.department
    };
    (req as any).__auditContext = {
      userId: decoded.id,
      userName: decoded.name || decoded.email || decoded.id
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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
