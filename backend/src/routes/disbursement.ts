import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

const router = express.Router();
router.use(authenticateToken);

const generateDVNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { type: 'DV' },
    update: { value: { increment: 1 } },
    create: { type: 'DV', value: 1 }
  });
  const sequence = String(counter.value).padStart(5, '0');
  return `DV-${year}-${sequence}`;
};

router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { voucher: { include: { invoice: { include: { supplier: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireRole('DISBURSEMENT', 'ACCOUNTING', 'AP_CLERK', 'TREASURER', 'CASHIER', 'ADMIN'), async (req, res) => {
  try {
    const data = req.body;
    
    const voucher = await prisma.voucherPackage.findUnique({ 
      where: { id: data.voucherId },
      include: { invoice: true }
    });
    
    if (!voucher || voucher.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Approved voucher required for disbursement' });
    }

    const dvNumber = data.dvNumber || await generateDVNumber();
    const paymentMode = data.paymentMode || (data.checkNo ? 'CHECK' : 'BANK_TRANSFER');

    const payment = await prisma.$transaction(async (tx) => {
      const pmt = await tx.payment.create({
        data: {
          voucherId: voucher.id,
          dvNumber,
          amount: voucher.amountFigures,
          paymentMode,
          checkNo: data.checkNo,
          referenceNo: data.referenceNo,
          recipientName: data.recipientName || voucher.invoice.invoiceNo,
          modeOfReceipt: data.modeOfReceipt,
          releasedBy: (req as any).user?.name || 'SYSTEM',
          acknowledgedReceipt: data.acknowledgedReceipt,
          cashier: (req as any).user?.name || 'SYSTEM',
          status: 'PENDING_OR'
        }
      });

      // Update Voucher Status
      await tx.voucherPackage.update({
        where: { id: voucher.id },
        data: { status: 'DISBURSED' }
      });

      // Update Invoice Status
      await tx.supplierInvoice.update({
        where: { id: voucher.invoiceId },
        data: { status: 'PAID' }
      });

      // Post to AP Ledger (Debit to reduce balance)
      const previous = await tx.aPLedgerEntry.findFirst({
        where: { supplierId: voucher.invoice.supplierId },
        orderBy: { createdAt: 'desc' }
      });
      const previousBalance = Number(previous?.balance || 0);
      const amount = Number(voucher.amountFigures);

      await tx.aPLedgerEntry.create({
        data: {
          supplierId: voucher.invoice.supplierId,
          paymentId: pmt.id,
          description: `Payment for Voucher ${voucher.voucherNo}`,
          debit: voucher.amountFigures,
          balance: previousBalance - amount
        }
      });

      return pmt;
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'PAYMENT',
      referenceId: payment.id,
      referenceNo: payment.dvNumber || payment.referenceNo || undefined,
      details: `Created disbursement ${payment.dvNumber || payment.id}`
    });

    res.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/receive-or', requireRole('DISBURSEMENT', 'ACCOUNTING', 'AP_CLERK', 'ADMIN'), async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: String(req.params.id) },
      data: {
        supplierORNo: req.body.supplierORNo,
        supplierORDate: new Date(req.body.supplierORDate),
        isORValid: true,
        archivedAt: new Date(),
        status: 'CLOSED'
      }
    });
    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'UPDATE',
      module: 'PAYMENT',
      referenceId: payment.id,
      referenceNo: payment.dvNumber || payment.referenceNo || undefined,
      details: `Closed disbursement ${payment.dvNumber || payment.id}`
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
