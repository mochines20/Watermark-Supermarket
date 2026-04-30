import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.supplierInvoice.findMany({
      include: { supplier: true, po: true, rr: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, po: true, rr: true, items: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const data = req.body;

    const po = await prisma.purchaseOrder.findUnique({ where: { poNumber: data.poNumber }, include: { items: true } });
    const rr = await prisma.receivingReport.findUnique({ where: { rrNumber: data.rrNumber }, include: { items: true } });
    
    if (!po) return res.status(400).json({ error: 'Invalid PO Number' });
    
    // 3-Way Match Logic
    let matchStatus = 'PENDING';
    if (po && rr) {
      // Very basic 3-way match validation
      const poTotal = Number(po.total);
      const rrTotal = rr.items.reduce((sum, item) => sum + Number(item.total), 0);
      const invTotal = Number(data.totalAmountDue);
      
      // If totals are within a small margin of error (e.g., rounding), mark as matched
      if (Math.abs(poTotal - invTotal) <= 1 && Math.abs(rrTotal - invTotal) <= 1) {
        matchStatus = 'MATCHED';
      } else {
        matchStatus = 'EXCEPTION';
      }
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.supplierInvoice.create({
        data: {
          invoiceNo: data.invoiceNo,
          supplierId: po.supplierId,
          poId: po.id,
          rrId: rr?.id,
          invoiceDate: new Date(data.invoiceDate),
          dueDate: new Date(data.dueDate),
          grossAmount: data.grossAmount,
          discount: data.discount || 0,
          netAmount: data.netAmount,
          vatAmount: data.vatAmount,
          totalAmountDue: data.totalAmountDue,
          threeWayStatus: matchStatus as any,
          status: 'OPEN',
          items: {
            create: data.items.map((i: any, idx: number) => ({
              no: idx + 1,
              description: i.description,
              qty: Number(i.qty),
              unit: i.unit,
              unitPrice: Number(i.unitPrice),
              amount: Number(i.amount)
            }))
          }
        }
      });

      // Post to AP Subsidiary Ledger
      await tx.aPLedgerEntry.create({
        data: {
          supplierId: po.supplierId,
          invoiceId: inv.id,
          description: `Invoice ${inv.invoiceNo}`,
          credit: inv.totalAmountDue,
          balance: inv.totalAmountDue // Needs rolling balance logic in production
        }
      });

      return inv;
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ledger', async (req, res) => {
  try {
    const ledger = await prisma.aPLedgerEntry.findMany({
      include: { supplier: true, invoice: true, payment: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
