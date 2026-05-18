import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

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
      where: { id: String(req.params.id) },
      include: { supplier: true, po: true, rr: true, items: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/invoices', requireRole('ACCOUNTING', 'AP_CLERK', 'ADMIN'), async (req, res) => {
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

      const previous = await tx.aPLedgerEntry.findFirst({
        where: { supplierId: po.supplierId },
        orderBy: { createdAt: 'desc' }
      });
      const previousBalance = Number(previous?.balance || 0);
      const invoiceTotal = Number(inv.totalAmountDue);

      // Post to AP Subsidiary Ledger
      await tx.aPLedgerEntry.create({
        data: {
          supplierId: po.supplierId,
          invoiceId: inv.id,
          description: `Invoice ${inv.invoiceNo}`,
          credit: inv.totalAmountDue,
          balance: previousBalance + invoiceTotal
        }
      });

      return inv;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'AP',
      referenceId: invoice.id,
      referenceNo: invoice.invoiceNo,
      details: `Created supplier invoice ${invoice.invoiceNo}`
    });

    res.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/aging', async (req, res) => {
  try {
    const invoices = await prisma.supplierInvoice.findMany({
      where: { status: { notIn: ['PAID', 'CANCELLED'] } },
      include: { supplier: true },
      orderBy: { dueDate: 'asc' }
    });

    const buckets = [
      { key: 'current', label: 'Current', count: 0, amount: 0, invoices: [] as any[] },
      { key: 'days1to30', label: '1-30 Days', count: 0, amount: 0, invoices: [] as any[] },
      { key: 'days31to60', label: '31-60 Days', count: 0, amount: 0, invoices: [] as any[] },
      { key: 'days61to90', label: '61-90 Days', count: 0, amount: 0, invoices: [] as any[] },
      { key: 'days90plus', label: '90+ Days', count: 0, amount: 0, invoices: [] as any[] }
    ];

    const now = new Date();
    for (const invoice of invoices) {
      const days = Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const bucket = days <= 0 ? buckets[0] : days <= 30 ? buckets[1] : days <= 60 ? buckets[2] : days <= 90 ? buckets[3] : buckets[4];
      bucket.count += 1;
      bucket.amount += Number(invoice.totalAmountDue);
      bucket.invoices.push(invoice);
    }

    res.json({ buckets });
  } catch (error) {
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
