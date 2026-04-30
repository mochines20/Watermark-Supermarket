import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

const generateVoucherNo = async (type: 'CDV' | 'CV') => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type },
    update: { value: { increment: 1 } },
    create: { type, value: 1 }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `${type}-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const vouchers = await prisma.voucherPackage.findMany({
      include: { invoice: true, entries: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    const invoice = await prisma.supplierInvoice.findUnique({ where: { id: data.invoiceId }, include: { supplier: true } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.threeWayStatus !== 'MATCHED') return res.status(400).json({ error: 'Invoice must be MATCHED to generate voucher' });

    const voucherType = data.voucherType || 'CHECK';
    const typePrefix = voucherType === 'CHECK' ? 'CV' : 'CDV';
    const voucherNo = await generateVoucherNo(typePrefix);

    const voucher = await prisma.voucherPackage.create({
      data: {
        voucherNo,
        voucherType,
        invoiceId: invoice.id,
        payee: invoice.supplier.name,
        payeeAddress: invoice.supplier.address,
        amountFigures: invoice.totalAmountDue,
        amountWords: data.amountWords || 'Amount in words',
        modeOfPayment: voucherType === 'CHECK' ? 'CHECK' : 'CASH',
        explanation: `Payment for Invoice ${invoice.invoiceNo}`,
        debitTotal: invoice.totalAmountDue,
        creditTotal: invoice.totalAmountDue,
        status: 'PENDING',
        preparedBy: (req as any).user?.name || 'SYSTEM',
        entries: {
          create: [
            { particulars: 'Accounts Payable', debit: invoice.totalAmountDue, credit: 0 },
            { particulars: 'Cash in Bank', debit: 0, credit: invoice.totalAmountDue }
          ]
        }
      },
      include: { entries: true }
    });

    res.json(voucher);
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const voucher = await prisma.voucherPackage.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedBy: (req as any).user?.name || 'Admin',
        approvedAt: new Date()
      }
    });
    
    // Also update invoice status
    await prisma.supplierInvoice.update({
      where: { id: voucher.invoiceId },
      data: { status: 'APPROVED' }
    });

    res.json(voucher);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const voucher = await prisma.voucherPackage.findUnique({
      where: { id: req.params.id },
      include: { 
        invoice: {
          include: { po: true, rr: true }
        }, 
        entries: true 
      }
    });
    if (!voucher) return res.status(404).json({ error: 'Not found' });
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
