import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';


const router = express.Router();
router.use(authenticateToken);

// Helper to generate PR number
const generatePRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type: 'PR' },
    update: { value: { increment: 1 } },
    create: { type: 'PR', value: 1 }
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
        dateNeeded: new Date(data.dateNeeded),
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
  } catch (error) {
    console.error('Error creating PR:', error);
    res.status(500).json({ error: 'Internal server error' });
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
