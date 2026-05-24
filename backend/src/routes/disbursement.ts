import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

const router = express.Router();
router.use(authenticateToken);

// Mock payment processing function
const mockProcessPayment = async (paymentData: any) => {
  // Simulate payment processing with configurable failure rate
  // In production, this would integrate with actual payment gateway
  const failureRate = Number(process.env.PAYMENT_FAILURE_RATE || '0.1'); // Default 10% failure rate
  const shouldFail = Math.random() < failureRate;
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Payment gateway timeout'));
      } else {
        resolve({ success: true, transactionId: `TXN-${Date.now()}` });
      }
    }, 1000); // Simulate network delay
  });
};

const generateDVNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.counter.findUnique({ where: { type: 'DV' } });
    if (existing) {
      return await tx.counter.update({
        where: { type: 'DV' },
        data: { value: { increment: 1 } }
      });
    } else {
      return await tx.counter.create({
        data: { type: 'DV', value: 1 }
      });
    }
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

    if (!data.voucherId) {
      return res.status(400).json({ error: 'Voucher ID is required for disbursement' });
    }
    if (!data.referenceNo || String(data.referenceNo).trim() === '') {
      return res.status(400).json({ error: 'Reference number is required for payment records' });
    }

    const voucher = await prisma.voucherPackage.findUnique({ 
      where: { id: data.voucherId },
      include: { invoice: true }
    });
    
    if (!voucher || voucher.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Approved voucher required for disbursement' });
    }

    const dvNumber = data.dvNumber || await generateDVNumber();
    const paymentMode = data.paymentMode || (data.checkNo ? 'CHECK' : 'BANK_TRANSFER');

    // Process payment through mock payment gateway
    try {
      await mockProcessPayment({
        dvNumber,
        amount: voucher.amountFigures,
        paymentMode,
        recipientName: data.recipientName || voucher.invoice.invoiceNo
      });
    } catch (paymentError: any) {
      // Payment processing failed - activate error handling
      console.error('Payment processing failed:', paymentError);
      return res.status(500).json({ 
        error: 'Payment processing failed', 
        details: paymentError.message,
        action: 'Payment transaction halted. Please notify administrator and retry.'
      });
    }

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
