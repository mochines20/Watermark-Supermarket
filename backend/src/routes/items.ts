import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        inventoryStockStatus: true
      }
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { itemCode, description, category, unit, standardCost, reorderPoint, reorderQty, barcode } = req.body;
    
    const existing = await prisma.item.findUnique({ where: { itemCode } });
    if (existing) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const item = await prisma.item.create({
      data: {
        itemCode,
        description,
        category,
        unit,
        standardCost,
        reorderPoint,
        reorderQty,
        barcode,
        inventoryStockStatus: {
          create: {
            qtyOnHand: 0,
            qtyOnOrder: 0,
            updatedBy: (req as any).user?.id || 'SYSTEM'
          }
        }
      }
    });
    
    res.json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { inventoryStockStatus: true }
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
