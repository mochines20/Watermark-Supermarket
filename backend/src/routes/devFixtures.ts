import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const dataFile = path.resolve(process.cwd(), 'dev-data.json');

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const money = (value: any) => Number(value || 0);

const seedData = () => {
  const supplier1 = {
    id: 'sup-001',
    vendorCode: 'SUP-001',
    name: 'Fresh Farms Produce Ltd.',
    address: 'Benguet, Philippines',
    contactPerson: 'Maria Clara',
    contactDetails: '0917-123-4567',
    email: 'sales@freshfarms.com',
    tin: '001-234-567-000',
    paymentTerms: 'NET_30',
    creditLimit: 100000,
    status: 'ACTIVE',
    isAccredited: true,
    accreditedDate: now(),
    createdAt: now(),
    updatedAt: now()
  };
  const supplier2 = {
    id: 'sup-002',
    vendorCode: 'SUP-002',
    name: 'Unilever Philippines',
    address: 'BGC, Taguig',
    contactPerson: 'Juan Dela Cruz',
    contactDetails: '02-8888-1234',
    email: 'distributor@unilever.ph',
    tin: '002-987-654-000',
    paymentTerms: 'NET_60',
    creditLimit: 250000,
    status: 'ACTIVE',
    isAccredited: true,
    accreditedDate: now(),
    createdAt: now(),
    updatedAt: now()
  };
  const item1 = {
    id: 'itm-001',
    itemCode: 'ITM-FF-001',
    description: 'Premium Fuji Apples (Box)',
    category: 'PRODUCE',
    unit: 'BOX',
    standardCost: 1200,
    reorderPoint: 50,
    reorderQty: 200,
    stockStatus: 'LOW_STOCK',
    supplierId: supplier1.id,
    supplierName: supplier1.name,
    qtyOnHand: 45,
    qtyOnOrder: 0,
    inventoryStockStatus: [{ qtyOnHand: 45, qtyOnOrder: 0 }]
  };
  const item2 = {
    id: 'itm-002',
    itemCode: 'ITM-UL-001',
    description: 'Dove Soap Original 135g (Pack of 3)',
    category: 'PERSONAL_CARE',
    unit: 'PACK',
    standardCost: 150,
    reorderPoint: 100,
    reorderQty: 300,
    stockStatus: 'NORMAL',
    supplierId: supplier2.id,
    supplierName: supplier2.name,
    qtyOnHand: 200,
    qtyOnOrder: 0,
    inventoryStockStatus: [{ qtyOnHand: 200, qtyOnOrder: 0 }]
  };
  const pr = {
    id: 'pr-001',
    prNumber: 'PR-2026-00001',
    requestedBy: 'Dev Administrator',
    requestingDept: 'GROCERY',
    purposeOfRequest: 'Restocking fast-moving personal care items',
    address: 'Watermark Supermarket',
    contactNo: '123-4567',
    datePrepared: now(),
    dateNeeded: now(),
    suggestedSupplier: supplier2.name,
    vendorCode: supplier2.vendorCode,
    totalCost: 15000,
    status: 'APPROVED',
    approvalLevel: 'STORE_MANAGER',
    encodedBy: 'dev-admin-id',
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'pri-001', itemCode: item2.itemCode, description: item2.description, quantity: 100, unit: item2.unit, unitCost: 150, totalCost: 15000 }]
  };
  const po = {
    id: 'po-001',
    poNumber: 'PO-2026-00001',
    supplierId: supplier2.id,
    supplier: supplier2,
    prId: pr.id,
    pr,
    date: now(),
    forDepartment: 'GROCERY',
    requisitioner: 'Dev Administrator',
    subtotal: 15000,
    taxVat: 0,
    total: 15000,
    status: 'OPEN',
    preparedBy: 'Dev Administrator',
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'poi-001', itemNo: item2.itemCode, description: item2.description, quantity: 100, unitPrice: 150, amount: 15000 }]
  };
  const rr = {
    id: 'rr-001',
    rrNumber: 'RR-2026-00001',
    poId: po.id,
    po,
    receivedFrom: supplier2.name,
    via: 'Direct Delivery',
    supplierId: supplier2.id,
    poDate: po.date,
    invoiceNo: 'INV-UL-0001',
    dateReceived: now(),
    prNumber: pr.prNumber,
    status: 'VERIFIED',
    receivingPersonnel: 'Dev Administrator',
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'rri-001', itemNo: item2.itemCode, description: item2.description, quantity: 100, unitPrice: 150, total: 15000 }]
  };
  const invoice = {
    id: 'inv-001',
    invoiceNo: 'INV-UL-0001',
    supplierId: supplier2.id,
    supplier: supplier2,
    poId: po.id,
    po,
    rrId: rr.id,
    rr,
    invoiceDate: now(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    grossAmount: 15000,
    discount: 0,
    netAmount: 15000,
    vatAmount: 0,
    totalAmountDue: 15000,
    threeWayStatus: 'MATCHED',
    status: 'APPROVED',
    createdAt: now(),
    updatedAt: now(),
    items: [{ id: 'invi-001', no: 1, description: item2.description, qty: 100, unit: item2.unit, unitPrice: 150, amount: 15000 }]
  };
  const voucher = {
    id: 'vch-001',
    voucherNo: 'CV-2026-00001',
    voucherType: 'CHECK',
    invoiceId: invoice.id,
    invoice,
    payee: supplier2.name,
    payeeAddress: supplier2.address,
    amountFigures: 15000,
    amountWords: 'Fifteen Thousand Pesos Only',
    modeOfPayment: 'CHECK',
    explanation: 'Payment for INV-UL-0001',
    debitTotal: 15000,
    creditTotal: 15000,
    status: 'APPROVED',
    preparedBy: 'Dev Administrator',
    approvedBy: 'Dev Administrator',
    approvedAt: now(),
    createdAt: now(),
    updatedAt: now(),
    entries: [{ particulars: 'Accounts Payable', debit: 15000, credit: 0 }, { particulars: 'Cash in Bank', debit: 0, credit: 15000 }]
  };
  return {
    counters: { PR: 1, PO: 1, RR: 1, DR: 0, INV: 1, CV: 1, DV: 0 },
    users: [{ id: 'dev-admin-id', name: 'Dev Administrator', email: 'admin@watermark.com', role: 'ADMIN', department: 'ADMINISTRATION', isActive: true, createdAt: now() }],
    suppliers: [supplier1, supplier2],
    items: [item1, item2],
    prs: [pr],
    pos: [po],
    rrs: [rr],
    discrepancies: [],
    invoices: [invoice],
    vouchers: [voucher],
    payments: [],
    ledger: [{ id: 'led-001', supplierId: supplier2.id, supplier: supplier2, invoiceId: invoice.id, invoice, description: `Invoice ${invoice.invoiceNo}`, debit: 0, credit: 15000, balance: 15000, createdAt: now() }],
    transactions: []
  };
};

const load = () => {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(seedData(), null, 2));
  }
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
};

const save = (data: any) => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
const nextNo = (data: any, type: string) => {
  data.counters[type] = (data.counters[type] || 0) + 1;
  return `${type}-${new Date().getFullYear()}-${String(data.counters[type]).padStart(5, '0')}`;
};
const stockStatus = (qty: number, reorderPoint: number) => qty === 0 ? 'CRITICAL' : qty <= reorderPoint ? 'LOW_STOCK' : 'NORMAL';

router.get('/auth/users', (_req, res) => res.json(load().users));

router.get('/items', (_req, res) => res.json(load().items));
router.post('/items', (req, res) => {
  const data = load();
  const item = { id: id('itm'), ...req.body, standardCost: money(req.body.standardCost), reorderPoint: Number(req.body.reorderPoint || 0), qtyOnHand: 0, stockStatus: 'CRITICAL', inventoryStockStatus: [{ qtyOnHand: 0, qtyOnOrder: 0 }], createdAt: now(), updatedAt: now() };
  data.items.push(item);
  save(data);
  res.json(item);
});

router.get('/suppliers', (_req, res) => res.json(load().suppliers));
router.post('/suppliers', (req, res) => {
  const data = load();
  const duplicate = data.suppliers.find((s: any) => s.name === req.body.name || s.email === req.body.email);
  if (duplicate) return res.status(409).json({ error: 'Vendor already exists', supplier: duplicate });
  const supplier = { id: id('sup'), ...req.body, status: 'ACTIVE', isAccredited: false, creditLimit: money(req.body.creditLimit), accreditedDate: now(), createdAt: now(), updatedAt: now() };
  data.suppliers.push(supplier);
  save(data);
  res.json(supplier);
});
router.put('/suppliers/:id', (req, res) => {
  const data = load();
  const supplier = data.suppliers.find((s: any) => s.id === req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  if (req.body.updateType === 'CONTACT') Object.assign(supplier, { name: req.body.name ?? supplier.name, contactDetails: req.body.phone ?? req.body.contactDetails ?? supplier.contactDetails, email: req.body.email ?? supplier.email });
  if (req.body.updateType === 'PAYMENT_TERMS') Object.assign(supplier, { paymentTerms: req.body.paymentTerms ?? supplier.paymentTerms, creditLimit: money(req.body.creditLimit ?? supplier.creditLimit) });
  if (req.body.updateType === 'ADDRESS') supplier.address = req.body.address ?? supplier.address;
  if (req.body.updateType === 'STATUS') Object.assign(supplier, { status: req.body.status, isAccredited: req.body.status === 'ACTIVE' });
  supplier.updatedAt = now();
  save(data);
  res.json(supplier);
});
router.post('/suppliers/:id/link-items', (req, res) => {
  const data = load();
  data.items.forEach((item: any) => {
    if (req.body.itemIds?.includes(item.id)) item.supplierId = req.params.id;
  });
  const supplier = data.suppliers.find((s: any) => s.id === req.params.id);
  supplier.items = data.items.filter((i: any) => i.supplierId === supplier.id);
  save(data);
  res.json(supplier);
});
router.get('/suppliers/:id/items', (req, res) => res.json(load().items.filter((i: any) => i.supplierId === req.params.id)));
router.get('/suppliers/:id/soa', (req, res) => {
  const data = load();
  const supplier = data.suppliers.find((s: any) => s.id === req.params.id);
  res.json({ ...supplier, invoices: data.invoices.filter((i: any) => i.supplierId === req.params.id), apLedgerEntries: data.ledger.filter((l: any) => l.supplierId === req.params.id) });
});

router.get('/inventory', (_req, res) => res.json(load().items));
router.get('/inventory/stock', (_req, res) => {
  const items = load().items;
  res.json({ stock: items.map((item: any) => ({ ...item.inventoryStockStatus[0], item })), alerts: items.filter((item: any) => ['LOW_STOCK', 'CRITICAL'].includes(item.stockStatus)) });
});
router.get('/inventory/alerts', (_req, res) => res.json(load().items.filter((item: any) => ['LOW_STOCK', 'CRITICAL'].includes(item.stockStatus))));
router.post('/inventory/transaction', (req, res) => {
  const data = load();
  const item = data.items.find((i: any) => i.id === req.body.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const previousQty = Number(item.qtyOnHand || 0);
  const quantity = Number(req.body.quantity);
  if (req.body.transactionType === 'DEDUCT' && previousQty < quantity) return res.status(400).json({ error: 'Insufficient stock' });
  const newQty = req.body.transactionType === 'ADD' ? previousQty + quantity : req.body.transactionType === 'DEDUCT' ? previousQty - quantity : quantity;
  Object.assign(item, { qtyOnHand: newQty, stockStatus: stockStatus(newQty, Number(item.reorderPoint)), inventoryStockStatus: [{ qtyOnHand: newQty, qtyOnOrder: item.qtyOnOrder || 0 }] });
  if (req.body.unitCost) item.standardCost = money(req.body.unitCost);
  const tx = { id: id('tx'), itemId: item.id, transactionType: req.body.transactionType, quantity, previousQty, newQty, variance: req.body.transactionType === 'PHYSICAL_COUNT' ? newQty - previousQty : null, unitCost: req.body.unitCost, remarks: req.body.remarks, createdBy: req.body.userId || 'dev-admin-id', createdAt: now() };
  data.transactions.push(tx);
  save(data);
  res.json(item);
});
router.get('/inventory/:id/transactions', (req, res) => res.json(load().transactions.filter((tx: any) => tx.itemId === req.params.id)));

router.get('/pr', (_req, res) => res.json(load().prs));
router.post('/pr', (req, res) => {
  const data = load();
  const totalCost = req.body.items.reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitCost), 0);
  const pr = { id: id('pr'), ...req.body, prNumber: nextNo(data, 'PR'), totalCost, status: 'DRAFT', approvalLevel: totalCost > 100000 ? 'CFO' : totalCost > 20000 ? 'FINANCE_BUDGETING' : 'STORE_MANAGER', encodedBy: 'Dev Administrator', createdAt: now(), updatedAt: now() };
  data.prs.unshift(pr);
  save(data);
  res.json(pr);
});
router.get('/pr/:id', (req, res) => res.json(load().prs.find((pr: any) => pr.id === req.params.id)));
router.post('/pr/:id/submit', (req, res) => updateOne(req, res, 'prs', { status: 'PENDING_APPROVAL' }));
router.post('/pr/:id/approve', (req, res) => updateOne(req, res, 'prs', { status: 'APPROVED', approvedBy: 'Dev Administrator', approvedAt: now() }));
router.post('/pr/:id/reject', (req, res) => updateOne(req, res, 'prs', { status: 'REJECTED', rejectedBy: 'Dev Administrator', rejectedAt: now(), rejectionRemarks: req.body.remarks }));

router.get('/po', (_req, res) => res.json(load().pos));
router.post('/po', (req, res) => {
  const data = load();
  const pr = data.prs.find((p: any) => p.id === req.body.prId);
  const supplier = data.suppliers.find((s: any) => s.id === req.body.supplierId);
  if (!pr || pr.status !== 'APPROVED') return res.status(400).json({ error: 'Valid approved PR required to create PO' });
  const po = { id: id('po'), poNumber: nextNo(data, 'PO'), supplierId: supplier.id, supplier, prId: pr.id, pr, date: now(), forDepartment: pr.requestingDept, requisitioner: pr.requestedBy, subtotal: pr.totalCost, taxVat: 0, total: pr.totalCost, status: 'OPEN', preparedBy: 'Dev Administrator', items: pr.items.map((item: any) => ({ itemNo: item.itemCode, description: item.description, quantity: item.quantity, unitPrice: item.unitCost, amount: item.totalCost })), createdAt: now(), updatedAt: now() };
  data.pos.unshift(po);
  save(data);
  res.json(po);
});

router.get('/receiving/dashboard', (_req, res) => {
  const data = load();
  const today = new Date().toDateString();
  res.json({ pendingDeliveries: data.pos.filter((po: any) => ['OPEN', 'PARTIALLY_RECEIVED'].includes(po.status)).length, todaysReceipts: data.rrs.filter((rr: any) => new Date(rr.createdAt).toDateString() === today).length, openDiscrepancies: data.discrepancies.length, recentReceipts: data.rrs.slice(0, 5), stockAlerts: data.items.filter((item: any) => ['LOW_STOCK', 'CRITICAL'].includes(item.stockStatus)) });
});
router.get('/receiving/deliveries', (_req, res) => res.json(load().pos.filter((po: any) => ['OPEN', 'PARTIALLY_RECEIVED'].includes(po.status))));
router.get('/receiving', (_req, res) => res.json(load().rrs));
router.post('/receiving', (req, res) => {
  const data = load();
  const po = data.pos.find((p: any) => p.id === req.body.poId);
  if (!po) return res.status(400).json({ error: 'Valid open PO required to create RR' });
  const rr = { id: id('rr'), rrNumber: nextNo(data, 'RR'), poId: po.id, po, receivedFrom: po.supplier.name, via: req.body.via || 'Direct Delivery', supplierId: po.supplierId, poDate: po.date, invoiceNo: req.body.invoiceNo, prNumber: po.pr.prNumber, status: req.body.discrepancyItems?.length ? 'DISCREPANCY' : 'VERIFIED', receivingPersonnel: 'Dev Administrator', items: req.body.items, dateReceived: now(), createdAt: now(), updatedAt: now() };
  data.rrs.unshift(rr);
  po.status = 'RECEIVED';
  for (const received of req.body.items || []) {
    const item = data.items.find((i: any) => i.itemCode === received.itemNo);
    if (item) {
      item.qtyOnHand = Number(item.qtyOnHand || 0) + Number(received.quantity || 0);
      item.inventoryStockStatus = [{ qtyOnHand: item.qtyOnHand, qtyOnOrder: item.qtyOnOrder || 0 }];
      item.stockStatus = stockStatus(item.qtyOnHand, item.reorderPoint);
    }
  }
  for (const d of req.body.discrepancyItems || []) data.discrepancies.unshift({ id: id('dr'), reportNo: nextNo(data, 'DR'), rrId: rr.id, rr, poNumber: po.poNumber, rrNumber: rr.rrNumber, supplier: po.supplier.name, descriptionOfIssue: d.descriptionOfIssue, natureQuantity: true, recommendedAction: d.actionTaken || 'For review', createdAt: now(), updatedAt: now() });
  save(data);
  res.json(rr);
});
router.get('/receiving/:id', (req, res) => res.json(load().rrs.find((rr: any) => rr.id === req.params.id)));
router.get('/discrepancies', (_req, res) => res.json(load().discrepancies));

router.get('/ap/invoices', (_req, res) => res.json(load().invoices));
router.post('/ap/invoices', (req, res) => {
  const data = load();
  const po = data.pos.find((p: any) => p.poNumber === req.body.poNumber);
  const rr = data.rrs.find((r: any) => r.rrNumber === req.body.rrNumber);
  if (!po) return res.status(400).json({ error: 'Invalid PO Number' });
  const total = money(req.body.totalAmountDue);
  const invoice = { id: id('inv'), ...req.body, supplierId: po.supplierId, supplier: po.supplier, poId: po.id, po, rrId: rr?.id, rr, grossAmount: money(req.body.grossAmount || total), netAmount: money(req.body.netAmount || total), vatAmount: money(req.body.vatAmount || 0), totalAmountDue: total, threeWayStatus: Math.abs(money(po.total) - total) <= 1 ? 'MATCHED' : 'EXCEPTION', status: 'OPEN', createdAt: now(), updatedAt: now(), items: req.body.items || [] };
  data.invoices.unshift(invoice);
  const previous = data.ledger[0]?.balance || 0;
  data.ledger.unshift({ id: id('led'), supplierId: po.supplierId, supplier: po.supplier, invoiceId: invoice.id, invoice, description: `Invoice ${invoice.invoiceNo}`, debit: 0, credit: total, balance: previous + total, createdAt: now() });
  save(data);
  res.json(invoice);
});
router.get('/ap/invoices/:id', (req, res) => res.json(load().invoices.find((i: any) => i.id === req.params.id)));
router.get('/ap/ledger', (_req, res) => res.json(load().ledger));
router.get('/ap/aging', (_req, res) => res.json({ buckets: aging(load().invoices) }));

router.get('/vouchers', (_req, res) => res.json(load().vouchers));
router.post('/vouchers', (req, res) => {
  const data = load();
  const invoice = data.invoices.find((i: any) => i.id === req.body.invoiceId);
  if (!invoice || invoice.threeWayStatus !== 'MATCHED') return res.status(400).json({ error: 'Invoice must be MATCHED to generate voucher' });
  const voucher = { id: id('vch'), voucherNo: nextNo(data, req.body.voucherType === 'CASH_DISBURSEMENT' ? 'CDV' : 'CV'), voucherType: req.body.voucherType || 'CHECK', invoiceId: invoice.id, invoice, payee: invoice.supplier.name, payeeAddress: invoice.supplier.address, amountFigures: invoice.totalAmountDue, amountWords: req.body.amountWords || 'Amount in words', modeOfPayment: 'CHECK', explanation: `Payment for Invoice ${invoice.invoiceNo}`, debitTotal: invoice.totalAmountDue, creditTotal: invoice.totalAmountDue, status: 'PENDING', preparedBy: 'Dev Administrator', entries: [], createdAt: now(), updatedAt: now() };
  data.vouchers.unshift(voucher);
  save(data);
  res.json(voucher);
});
router.post('/vouchers/:id/approve', (req, res) => updateOne(req, res, 'vouchers', { status: 'APPROVED', approvedBy: 'Dev Administrator', approvedAt: now() }));
router.get('/vouchers/:id', (req, res) => res.json(load().vouchers.find((v: any) => v.id === req.params.id)));

router.get('/disbursement', (_req, res) => res.json(load().payments));
router.post('/disbursement', (req, res) => {
  const data = load();
  const voucher = data.vouchers.find((v: any) => v.id === req.body.voucherId);
  if (!voucher || voucher.status !== 'APPROVED') return res.status(400).json({ error: 'Approved voucher required for disbursement' });
  const payment = { id: id('pay'), voucherId: voucher.id, voucher, dvNumber: nextNo(data, 'DV'), paymentDate: now(), amount: voucher.amountFigures, paymentMode: req.body.paymentMode || 'CHECK', checkNo: req.body.checkNo, referenceNo: req.body.referenceNo, recipientName: req.body.recipientName || voucher.payee, modeOfReceipt: req.body.modeOfReceipt, releasedBy: 'Dev Administrator', acknowledgedReceipt: req.body.acknowledgedReceipt, status: 'PENDING_OR', cashier: 'Dev Administrator', createdAt: now(), updatedAt: now() };
  data.payments.unshift(payment);
  voucher.status = 'DISBURSED';
  voucher.invoice.status = 'PAID';
  const previous = data.ledger[0]?.balance || 0;
  data.ledger.unshift({ id: id('led'), supplierId: voucher.invoice.supplierId, supplier: voucher.invoice.supplier, paymentId: payment.id, payment, description: `Payment for Voucher ${voucher.voucherNo}`, debit: payment.amount, credit: 0, balance: previous - payment.amount, createdAt: now() });
  save(data);
  res.json(payment);
});
router.post('/disbursement/:id/receive-or', (req, res) => updateOne(req, res, 'payments', { status: 'CLOSED', supplierORNo: req.body.supplierORNo, supplierORDate: req.body.supplierORDate, isORValid: true, archivedAt: now() }));

function updateOne(req: any, res: any, collection: string, patch: any) {
  const data = load();
  const row = data[collection].find((item: any) => item.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  Object.assign(row, patch, { updatedAt: now() });
  save(data);
  res.json(row);
}

function aging(invoices: any[]) {
  const base = [
    { key: 'current', label: 'Current', count: 0, amount: 0, invoices: [] as any[] },
    { key: 'days1to30', label: '1-30 Days', count: 0, amount: 0, invoices: [] as any[] },
    { key: 'days31to60', label: '31-60 Days', count: 0, amount: 0, invoices: [] as any[] },
    { key: 'days61to90', label: '61-90 Days', count: 0, amount: 0, invoices: [] as any[] },
    { key: 'days90plus', label: '90+ Days', count: 0, amount: 0, invoices: [] as any[] }
  ];
  for (const invoice of invoices.filter((i: any) => !['PAID', 'CANCELLED'].includes(i.status))) {
    const days = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000);
    const bucket = days <= 0 ? base[0] : days <= 30 ? base[1] : days <= 60 ? base[2] : days <= 90 ? base[3] : base[4];
    bucket.count += 1;
    bucket.amount += money(invoice.totalAmountDue);
    bucket.invoices.push(invoice);
  }
  return base;
}

export default router;
