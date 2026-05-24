import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

const router = express.Router();
router.use(authenticateToken);

// Helper to generate RR number with row-level locking
const generateRRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { type: 'RR' } });
    if (existing) {
      return await tx.counter.update({
        where: { type: 'RR' },
        data: { value: { increment: 1 } }
      });
    } else {
      return await tx.counter.create({
        data: { type: 'RR', value: 1 }
      });
    }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `RR-${year}-${sequence}`;
};

const generateDRNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { type: 'DR' } });
    if (existing) {
      return await tx.counter.update({
        where: { type: 'DR' },
        data: { value: { increment: 1 } }
      });
    } else {
      return await tx.counter.create({
        data: { type: 'DR', value: 1 }
      });
    }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `DR-${year}-${sequence}`;
};

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingDeliveries, todaysReceipts, openDiscrepancies, recentReceipts, stockAlerts] = await Promise.all([
      prisma.purchaseOrder.count({ where: { status: { in: ['OPEN', 'PARTIALLY_RECEIVED'] } } }),
      prisma.receivingReport.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.discrepancyReport.count(),
      prisma.receivingReport.findMany({
        take: 5,
        include: { po: { include: { supplier: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.item.findMany({
        where: { stockStatus: { in: ['LOW_STOCK', 'CRITICAL'] } },
        include: { inventoryStockStatus: true, supplier: true },
        take: 10
      })
    ]);

    res.json({ pendingDeliveries, todaysReceipts, openDiscrepancies, recentReceipts, stockAlerts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/deliveries', async (req, res) => {
  try {
    const { poNo, supplier, dateFrom, dateTo, status } = req.query;
    const filters: any = {
      status: status ? String(status) : { in: ['OPEN', 'PARTIALLY_RECEIVED'] }
    };
    if (poNo) filters.poNumber = { contains: String(poNo), mode: 'insensitive' };
    if (dateFrom || dateTo) {
      filters.date = {};
      if (dateFrom) filters.date.gte = new Date(String(dateFrom));
      if (dateTo) filters.date.lte = new Date(String(dateTo));
    }
    if (supplier) {
      filters.supplier = {
        OR: [
          { name: { contains: String(supplier), mode: 'insensitive' } },
          { vendorCode: { contains: String(supplier), mode: 'insensitive' } }
        ]
      };
    }

    const deliveries = await prisma.purchaseOrder.findMany({
      where: filters,
      include: { supplier: true, items: true, pr: true },
      orderBy: { date: 'desc' }
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

router.post('/', requireRole('RECEIVING', 'RECEIVING_CLERK', 'ADMIN'), async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = ['poId', 'receivedFrom', 'via', 'items'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || (typeof data[field] === 'string' && String(data[field]).trim() === '')) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({ error: 'Receiving report must include at least one item' });
    }

    const invalidItem = data.items.find((item: any) => !item.itemNo || !item.description || Number(item.quantity) < 0 || Number(item.unitPrice) < 0 || Number(item.total) < 0);
    if (invalidItem) {
      return res.status(400).json({ error: 'Each receiving item must include item number, description, non-negative quantity, and valid prices' });
    }

    // Ensure PO exists and is approved
    const po = await prisma.purchaseOrder.findUnique({ 
      where: { id: data.poId }, 
      include: { items: true, pr: true, supplier: true } 
    });
    
    if (!po || (po.status !== 'OPEN' && po.status !== 'PARTIALLY_RECEIVED')) {
      return res.status(400).json({ error: 'Valid open PO required to create RR' });
    }

    const rrNumber = await generateRRNumber();

    const rr = await prisma.$transaction(async (tx) => {
      // Validate received quantities don't exceed ordered quantities
      for (const item of data.items) {
        const poItem = po.items.find((poItem: any) => poItem.itemNo === item.itemNo);
        if (poItem && Number(item.quantity) > Number(poItem.quantity)) {
          throw new Error(`Received quantity for ${item.itemNo} exceeds ordered quantity`);
        }
      }

      // Create the Receiving Report
      const newRR = await tx.receivingReport.create({
        data: {
          rrNumber,
          poId: po.id,
          receivedFrom: data.receivedFrom || po.supplier.name,
          via: data.via || 'Direct Delivery',
          supplierId: po.supplierId,
          poDate: po.date,
          invoiceNo: data.invoiceNo,
          prNumber: po.pr.prNumber,
          receivingPersonnel: (req as any).user?.name || 'SYSTEM',
          status: data.discrepancyItems?.length ? 'DISCREPANCY' : 'VERIFIED',
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

      // Update PO Status - check if all items received or partial
      const totalOrdered = po.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
      const totalReceived = data.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
      const poStatus = totalReceived >= totalOrdered ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: poStatus }
      });

      for (const item of data.discrepancyItems || []) {
        const reportNo = await generateDRNumber();
        await tx.discrepancyReport.create({
          data: {
            reportNo,
            rrId: newRR.id,
            reportedBy: (req as any).user?.name || 'SYSTEM',
            department: 'RECEIVING',
            location: data.location || 'Warehouse',
            prNumber: po.pr.prNumber,
            poNumber: po.poNumber,
            rrNumber: newRR.rrNumber,
            supplier: po.supplier.name,
            descriptionOfIssue: item.descriptionOfIssue || `${item.itemNo || item.description} variance: ${item.varianceQty || ''}`,
            natureQuantity: true,
            natureQuality: item.reason === 'DAMAGED',
            recommendedAction: item.actionTaken || 'For review',
            receivedBy: data.receivedBy || 'Pending',
            receivedByPosition: data.receivedByPosition || 'Pending'
          }
        });
      }

      // Update Inventory Stock Status
      for (const item of data.items) {
        const itemRecord = await tx.item.findUnique({ where: { itemCode: item.itemNo } });
        if (itemRecord) {
          const existingStock = await tx.inventoryStock.findFirst({ where: { itemId: itemRecord.id } });
          if (existingStock) {
            await tx.inventoryStock.update({
              where: { id: existingStock.id },
              data: {
                qtyOnHand: { increment: item.quantity },
                lastUpdated: new Date(),
                updatedBy: (req as any).user?.name || 'SYSTEM'
              }
            });
          } else {
            await tx.inventoryStock.create({
              data: {
                itemId: itemRecord.id,
                qtyOnHand: item.quantity,
                qtyOnOrder: 0,
                updatedBy: (req as any).user?.name || 'SYSTEM'
              }
            });
          }
        }
      }

      return newRR;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'RR',
      referenceId: rr.id,
      referenceNo: rr.rrNumber,
      details: `Created receiving report ${rr.rrNumber}`
    });
    
    res.json(rr);
  } catch (error: any) {
    console.error('Error creating RR:', error);
    if (error.message && error.message.includes('exceeds ordered quantity')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate RR number detected' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Required record not found' });
    }
    res.status(500).json({ error: 'Failed to create receiving report' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rr = await prisma.receivingReport.findUnique({
      where: { id: String(req.params.id) },
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
