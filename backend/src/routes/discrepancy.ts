import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

const generateDRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type: 'DR' },
    update: { value: { increment: 1 } },
    create: { type: 'DR', value: 1 }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `DR-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const drs = await prisma.discrepancyReport.findMany({
      include: { rr: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(drs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    const rr = await prisma.receivingReport.findUnique({ where: { id: data.rrId } });
    if (!rr) return res.status(404).json({ error: 'Receiving Report not found' });

    const reportNo = await generateDRNumber();

    const dr = await prisma.$transaction(async (tx) => {
      const newDR = await tx.discrepancyReport.create({
        data: {
          reportNo,
          rrId: rr.id,
          reportedBy: (req as any).user?.name || 'SYSTEM',
          department: data.department || 'Receiving',
          location: data.location || 'Warehouse',
          prNumber: rr.prNumber,
          poNumber: data.poNumber,
          rrNumber: rr.rrNumber,
          supplier: data.supplier,
          descriptionOfIssue: data.descriptionOfIssue,
          natureQuantity: data.natureQuantity,
          natureQuality: data.natureQuality,
          naturePricing: data.naturePricing,
          natureOthers: data.natureOthers,
          recommendedAction: data.recommendedAction,
          receivedBy: data.receivedBy || 'Pending',
          receivedByPosition: data.receivedByPosition || 'Pending'
        }
      });

      await tx.receivingReport.update({
        where: { id: rr.id },
        data: { status: 'DISCREPANCY' }
      });

      return newDR;
    });

    res.json(dr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const dr = await prisma.discrepancyReport.findUnique({
      where: { id: req.params.id },
      include: {
        rr: {
          include: {
            po: {
              include: { supplier: true }
            }
          }
        }
      }
    });
    if (!dr) return res.status(404).json({ error: 'Not found' });
    res.json(dr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
