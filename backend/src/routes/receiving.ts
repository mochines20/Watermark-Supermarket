import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Helper to generate RR number
const generateRRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type: 'RR' },
    update: { value: { increment: 1 } },
    create: { type: 'RR', value: 1 }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `RR-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const rrs = await prisma.receivingReport.findMany({
      include: { po: true, items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rrs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Ensure PO exists and is approved
    const po = await prisma.purchaseOrder.findUnique({ 
      where: { id: data.poId }, 
      include: { items: true, pr: true } 
    });
    
    if (!po || (po.status !== 'OPEN' && po.status !== 'PARTIALLY_RECEIVED')) {
      return res.status(400).json({ error: 'Valid open PO required to create RR' });
    }

    const rrNumber = await generateRRNumber();

    const rr = await prisma.$transaction(async (tx) => {
      // Create the Receiving Report
      const newRR = await tx.receivingReport.create({
        data: {
          rrNumber,
          poId: po.id,
          receivedFrom: data.receivedFrom || po.supplierId, // Should technically be name, but we link to supplier via supplierId below
          via: data.via || 'Direct Delivery',
          supplierId: po.supplierId,
          poDate: po.date,
          invoiceNo: data.invoiceNo,
          prNumber: po.pr.prNumber,
          receivingPersonnel: (req as any).user?.name || 'SYSTEM',
          status: 'VERIFIED',
          items: {
            create: data.items.map((item: any) => ({
              itemNo: item.itemNo,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total
            }))
          }
        },
        include: { items: true }
      });

      // Update PO Status
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'RECEIVED' } // Simplified logic
      });

      // Update Inventory Stock Status
      for (const item of data.items) {
        // find item by description or itemNo
        const itemRecord = await tx.item.findUnique({ where: { itemCode: item.itemNo } });
        if (itemRecord) {
          await tx.inventoryStock.updateMany({
            where: { itemId: itemRecord.id },
            data: { qtyOnHand: { increment: item.quantity } }
          });
        }
      }

      return newRR;
    });
    
    res.json(rr);
  } catch (error) {
    console.error('Error creating RR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rr = await prisma.receivingReport.findUnique({
      where: { id: req.params.id },
      include: { 
        items: true, 
        po: {
          include: {
            supplier: true
          }
        }
      }
    });
    if (!rr) return res.status(404).json({ error: 'Not found' });
    res.json(rr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
