import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { auditUser, logAudit } from '../utils/audit';

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

router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { vendorCode, name, address, contactPerson, contactDetails, email, tin, paymentTerms, creditLimit } = req.body;
    
    const duplicateVendor = await prisma.supplier.findFirst({
      where: { OR: [{ name }, { email }] }
    });
    if (duplicateVendor) {
      return res.status(409).json({ error: 'Vendor already exists', supplier: duplicateVendor });
    }

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
        creditLimit: Number(creditLimit || 0),
        status: 'ACTIVE',
        isAccredited: false, // Must be explicitly accredited
        accreditedDate: new Date() // Placeholder, normally updated upon accreditation
      }
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'CREATE',
      module: 'SUPPLIER',
      referenceId: supplier.id,
      referenceNo: supplier.vendorCode,
      details: `Created supplier ${supplier.name}`
    });
    
    res.json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { updateType } = req.body;
    const supplierId = String(req.params.id);
    const current = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!current) return res.status(404).json({ error: 'Supplier not found' });

    let data: any = {};
    if (updateType === 'CONTACT') {
      data = {
        name: req.body.name ?? current.name,
        contactDetails: req.body.phone ?? req.body.contactDetails ?? current.contactDetails,
        email: req.body.email ?? current.email
      };
    } else if (updateType === 'PAYMENT_TERMS') {
      data = {
        paymentTerms: req.body.paymentTerms ?? current.paymentTerms,
        creditLimit: Number(req.body.creditLimit ?? current.creditLimit)
      };
    } else if (updateType === 'ADDRESS') {
      data = { address: req.body.address ?? current.address };
    } else if (updateType === 'STATUS') {
      if (!['ACTIVE', 'INACTIVE'].includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid supplier status' });
      }
      data = {
        status: req.body.status,
        isAccredited: req.body.status === 'ACTIVE'
      };
    } else {
      return res.status(400).json({ error: 'updateType is required' });
    }

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data
    });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'UPDATE',
      module: 'SUPPLIER',
      referenceId: supplier.id,
      referenceNo: supplier.vendorCode,
      details: `Updated supplier ${updateType}`,
      previousData: current,
      newData: supplier
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/link-items', requireRole('ADMIN'), async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'itemIds must be an array' });
    }

    await prisma.item.updateMany({
      where: { id: { in: itemIds } },
      data: { supplierId: String(req.params.id) }
    });

    const supplier = await prisma.supplier.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true }
    });

    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const user = auditUser(req);
    await logAudit(prisma, {
      ...user,
      action: 'UPDATE',
      module: 'SUPPLIER',
      referenceId: supplier.id,
      referenceNo: supplier.vendorCode,
      details: `Linked ${itemIds.length} inventory item(s)`
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error linking supplier items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { supplierId: String(req.params.id) },
      include: { inventoryStockStatus: true },
      orderBy: { description: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/accredit', requireRole('ADMIN'), async (req, res) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: String(req.params.id) },
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
      where: { id: String(req.params.id) },
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
