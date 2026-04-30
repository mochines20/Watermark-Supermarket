import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Helper to generate PO number
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type: 'PO' },
    update: { value: { increment: 1 } },
    create: { type: 'PO', value: 1 }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `PO-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(pos);
  } catch (error: any) {
    const util = require('util');
    res.status(500).json({ error: util.inspect(error, { depth: null, showHidden: true }) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Ensure PR exists and is approved
    const pr = await prisma.purchaseRequisition.findUnique({ where: { id: data.prId }, include: { items: true } });
    if (!pr || pr.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Valid approved PR required to create PO' });
    }

    const poNumber = await generatePONumber();

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        prId: pr.id,
        supplierId: data.supplierId,
        date: new Date(data.date || Date.now()),
        forDepartment: pr.requestingDept,
        requisitioner: pr.requestedBy,
        subtotal: pr.totalCost,
        taxVat: 0,
        total: pr.totalCost,
        status: 'OPEN',
        preparedBy: (req as any).user?.name || 'SYSTEM',
        items: {
          create: pr.items.map((item: any) => ({
            itemNo: item.itemCode,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitCost,
            amount: item.totalCost
          }))
        }
      },
      include: { items: true }
    });
    
    res.json(po);
  } catch (error) {
    console.error('Error creating PO:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true, pr: true, supplier: true }
    });
    if (!po) return res.status(404).json({ error: 'Not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { 
        approvedBy: (req as any).user?.name || 'Admin',
        approvedAt: new Date()
      }
    });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
