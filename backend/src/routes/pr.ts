import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';


const router = express.Router();
router.use(authenticateToken);

// Helper to generate PR number with row-level locking
const generatePRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { type: 'PR' } });
    if (existing) {
      return await tx.counter.update({
        where: { type: 'PR' },
        data: { value: { increment: 1 } }
      });
    } else {
      return await tx.counter.create({
        data: { type: 'PR', value: 1 }
      });
    }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `PR-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const prs = await prisma.purchaseRequisition.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(prs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireRole('REQUESTER', 'STORE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const prNumber = await generatePRNumber();
    const data = req.body;

    const requiredFields = ['requestedBy', 'requestingDept', 'purposeOfRequest', 'dateNeeded', 'items'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && data[field].trim() === '')) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ error: 'Purchase requisition must include at least one item' });
    }

    const invalidItem = data.items.find((item: any) => !item.itemCode || !item.description || Number(item.quantity) <= 0 || Number(item.unitCost) < 0);
    if (invalidItem) {
      return res.status(400).json({ error: 'Each requisition item must include item code, description, positive quantity, and non-negative cost' });
    }

    const dateNeeded = new Date(data.dateNeeded);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(dateNeeded.getTime()) || dateNeeded < today) {
      return res.status(400).json({ error: 'Date needed must be today or in the future' });
    }

    // Auto-calculate total cost
    const totalCost = data.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitCost)), 0);

    let approvalLevel = 'STORE_MANAGER';
    if (totalCost > 100000) approvalLevel = 'CFO';
    else if (totalCost > 20000) approvalLevel = 'FINANCE_BUDGETING';

    const pr = await prisma.purchaseRequisition.create({
      data: {
        prNumber,
        requestedBy: data.requestedBy,
        requestingDept: data.requestingDept,
        purposeOfRequest: data.purposeOfRequest,
        address: data.address,
        contactNo: data.contactNo,
        dateNeeded: dateNeeded,
        suggestedSupplier: data.suggestedSupplier,
        vendorCode: data.vendorCode,
        totalCost,
        approvalLevel,
        status: 'DRAFT',
        encodedBy: (req as any).user?.name || 'SYSTEM',
        items: {
          create: data.items.map((item: any) => ({
            itemCode: item.itemCode,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitCost: Number(item.unitCost),
            totalCost: Number(item.quantity) * Number(item.unitCost)
          }))
        }
      },
      include: { items: true }
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'PR',
      referenceId: pr.id,
      referenceNo: pr.prNumber,
      details: `Created purchase requisition ${pr.prNumber}`
    });
    
    res.json(pr);
  } catch (error: any) {
    console.error('Error creating PR:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate entry detected' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Required record not found' });
    }
    res.status(500).json({ error: 'Failed to create purchase requisition' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pr = await prisma.purchaseRequisition.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true }
    });
    if (!pr) return res.status(404).json({ error: 'Not found' });
    res.json(pr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const pr = await prisma.purchaseRequisition.update({
      where: { id: String(req.params.id) },
      data: { status: 'PENDING_APPROVAL' }
    });
    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'UPDATE',
      module: 'PR',
      referenceId: pr.id,
      referenceNo: pr.prNumber,
      details: `Submitted purchase requisition ${pr.prNumber}`
    });
    res.json(pr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', requireRole('STORE_MANAGER', 'FINANCE_BUDGETING', 'CFO', 'ADMIN'), async (req, res) => {
  try {
    // Basic RBAC could be enforced here by checking req.user.role vs pr.approvalLevel
    const pr = await prisma.purchaseRequisition.update({
      where: { id: String(req.params.id) },
      data: { 
        status: 'APPROVED',
        approvedBy: (req as any).user?.name || 'Admin',
        approvedAt: new Date()
      }
    });
    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'APPROVE',
      module: 'PR',
      referenceId: pr.id,
      referenceNo: pr.prNumber,
      details: `Approved purchase requisition ${pr.prNumber}`
    });
    res.json(pr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reject', requireRole('STORE_MANAGER', 'FINANCE_BUDGETING', 'CFO', 'ADMIN'), async (req, res) => {
  try {
    const pr = await prisma.purchaseRequisition.update({
      where: { id: String(req.params.id) },
      data: { 
        status: 'REJECTED',
        rejectedBy: (req as any).user?.name || 'Admin',
        rejectedAt: new Date(),
        rejectionRemarks: req.body.remarks
      }
    });
    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'REJECT',
      module: 'PR',
      referenceId: pr.id,
      referenceNo: pr.prNumber,
      details: `Rejected purchase requisition ${pr.prNumber}`
    });
    res.json(pr);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
