import prisma from '../src/utils/prisma';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@watermark.com' },
    update: {},
    create: {
      email: 'admin@watermark.com',
      passwordHash,
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'ADMINISTRATION',
    },
  });
  
  const managerPasswordHash = await bcrypt.hash('manager123', 10);
  
  await prisma.user.upsert({
    where: { email: 'manager@watermark.com' },
    update: {},
    create: {
      email: 'manager@watermark.com',
      passwordHash: managerPasswordHash,
      name: 'Store Manager',
      role: 'STORE_MANAGER',
      department: 'MANAGEMENT',
    },
  });

  console.log('Seed: Admin user created (admin@watermark.com / admin123)');
  console.log('Seed: Manager user created (manager@watermark.com / manager123)');

  // DUMMY DATA SEEDING
  console.log('Generating dummy data...');

  // 1. Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { vendorCode: 'SUP-001' },
    update: {},
    create: {
      vendorCode: 'SUP-001',
      name: 'Fresh Farms Produce Ltd.',
      contactPerson: 'Maria Clara',
      contactDetails: '0917-123-4567',
      email: 'sales@freshfarms.com',
      address: 'Benguet, Philippines',
      tin: '001-234-567-000',
      paymentTerms: 'NET_30',
      accreditedDate: new Date(),
    }
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { vendorCode: 'SUP-002' },
    update: {},
    create: {
      vendorCode: 'SUP-002',
      name: 'Unilever Philippines',
      contactPerson: 'Juan Dela Cruz',
      contactDetails: '02-8888-1234',
      email: 'distributor@unilever.ph',
      address: 'Bonifacio Global City, Taguig',
      tin: '002-987-654-000',
      paymentTerms: 'NET_60',
      accreditedDate: new Date(),
    }
  });

  // 2. Inventory Items
  const item1 = await prisma.item.upsert({
    where: { itemCode: 'ITM-FF-001' },
    update: {},
    create: {
      itemCode: 'ITM-FF-001',
      description: 'Premium Fuji Apples (Box)',
      category: 'PRODUCE',
      unit: 'BOX',
      standardCost: 1200.00,
      reorderPoint: 50,
      reorderQty: 200,
      inventoryStockStatus: {
        create: [
          { qtyOnHand: 45, qtyOnOrder: 0, updatedBy: 'dev-admin-id' }
        ]
      }
    }
  });

  const item2 = await prisma.item.upsert({
    where: { itemCode: 'ITM-UL-001' },
    update: {},
    create: {
      itemCode: 'ITM-UL-001',
      description: 'Dove Soap Original 135g (Pack of 3)',
      category: 'PERSONAL_CARE',
      unit: 'PACK',
      standardCost: 150.00,
      reorderPoint: 100,
      reorderQty: 300,
      inventoryStockStatus: {
        create: [
          { qtyOnHand: 200, qtyOnOrder: 0, updatedBy: 'dev-admin-id' }
        ]
      }
    }
  });

  // 3. Dummy Purchase Requisition
  const pr = await prisma.purchaseRequisition.create({
    data: {
      prNumber: 'PR-2026-0002',
      requestedBy: 'System Administrator',
      requestingDept: 'GROCERY',
      purposeOfRequest: 'Restocking fast-moving personal care items',
      address: 'Watermark Supermarket',
      contactNo: '123-4567',
      dateNeeded: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalCost: 15000.00,
      status: 'APPROVED',
      encodedBy: 'dev-admin-id',
      items: {
        create: [
          {
            itemCode: item2.itemCode,
            description: item2.description,
            unit: item2.unit,
            quantity: 100,
            unitCost: item2.standardCost,
            totalCost: 15000.00
          }
        ]
      }
    }
  });

  // 4. Dummy Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0002',
        prId: pr.id,
        supplierId: supplier2.id,
        forDepartment: 'GROCERY',
        requisitioner: 'System Administrator',
        status: 'OPEN',
        preparedBy: 'dev-admin-id',
        subtotal: 13200.00,
        taxVat: 1800.00,
        total: 15000.00,
        items: {
          create: [
            {
              itemNo: item2.itemCode,
              description: item2.description,
              unitPrice: item2.standardCost,
              quantity: 100,
              amount: 15000.00
            }
          ]
        }
      }
    });
    console.log('Seed: Created dummy PR and PO.');

  // 5. Dummy Receiving Report
  const rr = await prisma.receivingReport.create({
    data: {
      rrNumber: 'RR-2026-0002',
      poId: po.id,
      receivedFrom: supplier2.name,
      via: 'Lalamove Delivery',
      supplierId: supplier2.id,
      poDate: po.date,
      invoiceNo: 'INV-UL-8899-2',
      prNumber: pr.prNumber,
      status: 'VERIFIED',
      receivingPersonnel: 'System Administrator',
      items: {
        create: [
          {
            itemNo: item2.itemCode,
            description: item2.description,
            quantity: 100,
            unitPrice: item2.standardCost,
            total: 15000.00
          }
        ]
      }
    }
  });
  console.log('Seed: Created dummy Receiving Report.');

  // 6. Dummy Discrepancy Report
  await prisma.discrepancyReport.create({
    data: {
      reportNo: 'DR-2026-0002',
      rrId: rr.id,
      reportedBy: 'System Administrator',
      department: 'RECEIVING',
      location: 'Warehouse Bay 1',
      prNumber: pr.prNumber,
      poNumber: po.poNumber,
      rrNumber: rr.rrNumber,
      supplier: supplier2.name,
      descriptionOfIssue: '2 boxes of Dove Soap were slightly damaged during transit.',
      natureQuality: true,
      recommendedAction: 'Accept with partial refund requested.',
      receivedBy: 'System Administrator',
      receivedByPosition: 'Warehouse Manager',
      receivedAt: new Date()
    }
  });
  console.log('Seed: Created dummy Discrepancy Report.');

  // 7. Dummy Supplier Invoice
  const invoice = await prisma.supplierInvoice.create({
    data: {
      invoiceNo: 'INV-UL-8899-2',
      supplierId: supplier2.id,
      poId: po.id,
      rrId: rr.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      grossAmount: 15000.00,
      discount: 0,
      netAmount: 13200.00,
      vatAmount: 1800.00,
      totalAmountDue: 15000.00,
      threeWayStatus: 'MATCHED',
      status: 'APPROVED',
      items: {
        create: [
          {
            no: 1,
            description: item2.description,
            qty: 100,
            unit: item2.unit,
            unitPrice: item2.standardCost,
            amount: 15000.00
          }
        ]
      }
    }
  });
  console.log('Seed: Created dummy Supplier Invoice.');

  // 8. Dummy Voucher Package
  const voucher = await prisma.voucherPackage.create({
    data: {
      voucherNo: 'CDV-2026-0002',
      voucherType: 'CASH_DISBURSEMENT',
      invoiceId: invoice.id,
      payee: supplier2.name,
      payeeAddress: supplier2.address,
      amountFigures: 15000.00,
      amountWords: 'Fifteen Thousand Pesos Only',
      modeOfPayment: 'ONLINE_TRANSFER',
      explanation: 'Payment for PO-2026-0002 (Dove Soap Delivery)',
      debitTotal: 15000.00,
      creditTotal: 15000.00,
      unbalancedAmt: 0,
      status: 'APPROVED',
      preparedBy: 'System Administrator',
      approvedBy: 'CFO Manager',
      approvedAt: new Date(),
      entries: {
        create: [
          { particulars: 'Accounts Payable - Trade', debit: 15000.00, credit: 0 },
          { particulars: 'Cash in Bank - BDO', debit: 0, credit: 15000.00 }
        ]
      }
    }
  });
  console.log('Seed: Created dummy Voucher Package.');

  // 9. Dummy Payment
  const payment = await prisma.payment.create({
    data: {
      voucherId: voucher.id,
      amount: 15000.00,
      referenceNo: 'BDO-ONL-88889999',
      remittanceAdvice: 'Sent via Email to supplier',
      supplierORNo: 'OR-UL-556678',
      supplierORDate: new Date(),
      isORValid: true,
      status: 'CLOSED',
      cashier: 'System Administrator'
    }
  });
  console.log('Seed: Created dummy Payment.');

  // 10. Dummy AP Ledger Entry
  await prisma.aPLedgerEntry.create({
    data: {
      supplierId: supplier2.id,
      invoiceId: invoice.id,
      paymentId: payment.id,
      description: 'Payment for INV-UL-8899-2',
      debit: 15000.00,
      credit: 0,
      balance: 0
    }
  });
  console.log('Seed: Created AP Ledger Entry.');

  console.log('Seed: Dummy data generated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
