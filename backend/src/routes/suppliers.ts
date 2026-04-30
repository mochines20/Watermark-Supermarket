import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { vendorCode, name, address, contactPerson, contactDetails, email, tin, paymentTerms } = req.body;
    
    const existing = await prisma.supplier.findUnique({ where: { vendorCode } });
    if (existing) {
      return res.status(400).json({ error: 'Vendor code already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        vendorCode,
        name,
        address,
        contactPerson,
        contactDetails,
        email,
        tin,
        paymentTerms,
        isAccredited: false, // Must be explicitly accredited
        accreditedDate: new Date() // Placeholder, normally updated upon accreditation
      }
    });
    
    res.json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/accredit', async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        isAccredited: true,
        accreditedDate: new Date()
      }
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/soa', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: {
          include: { po: true, rr: true }
        },
        apLedgerEntries: {
          include: { invoice: true, payment: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
