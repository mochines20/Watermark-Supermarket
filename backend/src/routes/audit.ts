import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 50);
    const moduleFilter = req.query.module ? String(req.query.module).toUpperCase() : undefined;

    const where = moduleFilter ? { module: moduleFilter } : undefined;
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(Math.max(limit, 1), 200)
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
