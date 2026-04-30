import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

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

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    const voucher = await prisma.voucherPackage.findUnique({ 
      where: { id: data.voucherId },
      include: { invoice: true }
    });
    
    if (!voucher || voucher.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Approved voucher required for disbursement' });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const pmt = await tx.payment.create({
        data: {
          voucherId: voucher.id,
          amount: voucher.amountFigures,
          checkNo: data.checkNo,
          referenceNo: data.referenceNo,
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
      await tx.aPLedgerEntry.create({
        data: {
          supplierId: voucher.invoice.supplierId,
          paymentId: pmt.id,
          description: `Payment for Voucher ${voucher.voucherNo}`,
          debit: voucher.amountFigures,
          balance: 0 // In real system, this is calculated dynamically
        }
      });

      return pmt;
    });

    res.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/receive-or', async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        supplierORNo: req.body.supplierORNo,
        supplierORDate: new Date(req.body.supplierORDate),
        isORValid: true,
        status: 'CLOSED'
      }
    });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
