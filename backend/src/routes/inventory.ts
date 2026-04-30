import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

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

// Create Variance Report
router.post('/variance', async (req, res) => {
  try {
    const { items } = req.body;
    
    const report = await prisma.inventoryVarianceReport.create({
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
    
    // Automatically adjust inventory stock to match physical quantity
    for (const i of items) {
      const itemRecord = await prisma.item.findUnique({ where: { itemCode: i.itemCode } });
      if (itemRecord) {
        await prisma.inventoryStock.updateMany({
          where: { itemId: itemRecord.id },
          data: { qtyOnHand: i.physicalQty }
        });
      }
    }

    res.json(report);
  } catch (error) {
    console.error('Error creating variance report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
