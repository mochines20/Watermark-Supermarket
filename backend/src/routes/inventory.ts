import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

const router = express.Router();
router.use(authenticateToken);

const getStockStatus = (qty: number, reorderPoint: number) => {
  if (qty === 0) return 'CRITICAL';
  if (qty <= reorderPoint) return 'LOW_STOCK';
  return 'NORMAL';
};

router.get('/', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        supplier: true,
        inventoryStockStatus: true
      },
      orderBy: { description: 'asc' }
    });

    res.json(items.map((item) => {
      const stock = item.inventoryStockStatus[0];
      return {
        ...item,
        qtyOnHand: stock?.qtyOnHand || 0,
        qtyOnOrder: stock?.qtyOnOrder || 0,
        supplierName: item.supplier?.name || ''
      };
    }));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Stock Status
router.get('/stock', async (req, res) => {
  try {
    const stock = await prisma.inventoryStock.findMany({
      include: { item: true }
    });
    
    // Calculate alerts
    const alerts = stock.filter(s => s.qtyOnHand <= s.item.reorderPoint);
    
    res.json({ stock, alerts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/transaction', requireRole('INVENTORY_CUSTODIAN', 'RECEIVING', 'RECEIVING_CLERK', 'ADMIN'), async (req, res) => {
  try {
    const { itemId, transactionType, quantity, unitCost, remarks, userId } = req.body;
    const qty = Number(quantity);
    const cost = unitCost === undefined || unitCost === '' ? undefined : Number(unitCost);

    if (!itemId || !transactionType || !Number.isFinite(qty) || qty < 0 || !userId) {
      return res.status(400).json({ error: 'itemId, transactionType, quantity, and userId are required' });
    }

    if (!['ADD', 'DEDUCT', 'PHYSICAL_COUNT'].includes(transactionType)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    if (cost !== undefined && (!Number.isFinite(cost) || cost <= 0)) {
      return res.status(400).json({ error: 'unitCost must be greater than 0' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id: itemId },
        include: { inventoryStockStatus: true, supplier: true }
      });

      if (!item) throw new Error('ITEM_NOT_FOUND');

      let stock = item.inventoryStockStatus[0];
      if (!stock) {
        stock = await tx.inventoryStock.create({
          data: { itemId: item.id, qtyOnHand: 0, qtyOnOrder: 0, updatedBy: userId }
        });
      }

      const previousQty = Number(stock.qtyOnHand);
      if (transactionType === 'DEDUCT' && previousQty < qty) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      let newQty = previousQty;
      let variance: number | undefined;
      if (transactionType === 'ADD') newQty = previousQty + qty;
      if (transactionType === 'DEDUCT') newQty = previousQty - qty;
      if (transactionType === 'PHYSICAL_COUNT') {
        variance = qty - previousQty;
        newQty = qty;
      }

      const stockStatus = getStockStatus(newQty, Number(item.reorderPoint));

      await tx.inventoryStock.update({
        where: { id: stock.id },
        data: {
          qtyOnHand: newQty,
          lastUpdated: new Date(),
          updatedBy: userId
        }
      });

      await tx.inventoryTransaction.create({
        data: {
          itemId: item.id,
          transactionType,
          quantity: qty,
          previousQty,
          newQty,
          variance,
          unitCost: cost,
          remarks,
          createdBy: userId
        }
      });

      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: {
          stockStatus,
          ...(cost !== undefined ? { standardCost: cost } : {})
        },
        include: { supplier: true, inventoryStockStatus: true }
      });

      return updatedItem;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'UPDATE',
      module: 'INVENTORY',
      referenceId: result.id,
      referenceNo: result.itemCode,
      details: `${transactionType} inventory transaction posted`
    });

    res.json({
      ...result,
      qtyOnHand: result.inventoryStockStatus[0]?.qtyOnHand || 0,
      supplierName: result.supplier?.name || ''
    });
  } catch (error: any) {
    if (error.message === 'ITEM_NOT_FOUND') return res.status(404).json({ error: 'Item not found' });
    if (error.message === 'INSUFFICIENT_STOCK') return res.status(400).json({ error: 'Insufficient stock' });
    console.error('Error posting inventory transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const alerts = await prisma.item.findMany({
      where: { stockStatus: { in: ['LOW_STOCK', 'CRITICAL'] } },
      include: { supplier: true, inventoryStockStatus: true },
      orderBy: [{ stockStatus: 'asc' }, { description: 'asc' }]
    });

    res.json(alerts.map((item) => ({
      ...item,
      qtyOnHand: item.inventoryStockStatus[0]?.qtyOnHand || 0,
      supplierName: item.supplier?.name || ''
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/transactions', async (req, res) => {
  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { itemId: String(req.params.id) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Variance Report
router.post('/variance', requireRole('INVENTORY_CUSTODIAN', 'ADMIN'), async (req, res) => {
  try {
    const { items } = req.body;
    
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.inventoryVarianceReport.create({
        data: {
          preparedBy: (req as any).user?.name || 'SYSTEM',
          items: {
            create: items.map((i: any) => ({
              itemCode: i.itemCode,
              description: i.description,
              systemQty: i.systemQty,
              physicalQty: i.physicalQty,
              variance: i.physicalQty - i.systemQty,
              remarks: i.remarks
            }))
          }
        },
        include: { items: true }
      });
      
      // Automatically adjust inventory stock to match physical quantity within transaction
      for (const i of items) {
        const itemRecord = await tx.item.findUnique({ where: { itemCode: i.itemCode } });
        if (itemRecord) {
          await tx.inventoryStock.updateMany({
            where: { itemId: itemRecord.id },
            data: { qtyOnHand: i.physicalQty }
          });
        }
      }

      return newReport;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'INVENTORY',
      referenceId: report.id,
      details: 'Created inventory variance report'
    });

    res.json(report);
  } catch (error) {
    console.error('Error creating variance report:', error);
    res.status(500).json({ error: 'Failed to create variance report' });
  }
});

export default router;
