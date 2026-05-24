import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

const router = express.Router();
router.use(authenticateToken);

// Helper to generate PO number with row-level locking
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { type: 'PO' } });
    if (existing) {
      return await tx.counter.update({
        where: { type: 'PO' },
        data: { value: { increment: 1 } }
      });
    } else {
      return await tx.counter.create({
        data: { type: 'PO', value: 1 }
      });
    }
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
    console.error('Error fetching POs:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/', requireRole('PURCHASING', 'PURCHASING_OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = ['prId', 'supplierId', 'expectedDeliveryDate'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Ensure PR exists and is approved
    const pr = await prisma.purchaseRequisition.findUnique({ where: { id: data.prId }, include: { items: true } });
    if (!pr || pr.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Valid approved PR required to create PO' });
    }

    // Validate supplier exists and is Active
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) {
      return res.status(400).json({ error: 'Supplier not found' });
    }
    if (supplier.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Supplier must be active to create a PO' });
    }

    const expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (Number.isNaN(expectedDeliveryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid expected delivery date' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectedDeliveryDate < today) {
      return res.status(400).json({ error: 'Expected delivery date must be today or in the future' });
    }

    const poNumber = await generatePONumber();

    const po = await prisma.$transaction(async (tx) => {
      const newPO = await tx.purchaseOrder.create({
        data: {
          poNumber,
          prId: pr.id,
          supplierId: data.supplierId,
          date: expectedDeliveryDate,
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

      // Update PR status within the same transaction
      await tx.purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: 'CONVERTED_TO_PO', linkedPONumber: newPO.poNumber }
      });

      return newPO;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'PO',
      referenceId: po.id,
      referenceNo: po.poNumber,
      details: `Created purchase order ${po.poNumber}`
    });
    
    res.json(po);
  } catch (error: any) {
    console.error('Error creating PO:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate PO number detected' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Required record not found' });
    }
    if (error.message && error.message.includes('Received quantity')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true, pr: true, supplier: true }
    });
    if (!po) return res.status(404).json({ error: 'Not found' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', requireRole('PURCHASING', 'PURCHASING_OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id: String(req.params.id) },
      data: { 
        approvedBy: (req as any).user?.name || 'Admin',
        approvedAt: new Date()
      }
    });
    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'APPROVE',
      module: 'PO',
      referenceId: po.id,
      referenceNo: po.poNumber,
      details: `Approved purchase order ${po.poNumber}`
    });
    res.json(po);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
