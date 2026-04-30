import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

// @ts-ignore - Supressing VS Code phantom cache error for PrismaClient
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

// Map Prisma actions to descriptive names for Audit Log
const mapAction = (action: string) => {
  switch (action) {
    case 'create': return 'CREATE';
    case 'update': return 'UPDATE';
    case 'delete': return 'DELETE';
    case 'upsert': return 'UPSERT';
    default: return action.toUpperCase();
  }
};

const mapModule = (modelName: string | undefined) => {
  if (!modelName) return 'SYSTEM';
  const name = modelName.toUpperCase();
  if (name.includes('PR') || name.includes('REQUISITION')) return 'PR';
  if (name.includes('PO') || name.includes('ORDER')) return 'PO';
  if (name.includes('RR') || name.includes('RECEIVING')) return 'RR';
  if (name.includes('INVENTORY') || name.includes('STOCK')) return 'INVENTORY';
  if (name.includes('INVOICE') || name.includes('LEDGER') || name.includes('AP')) return 'AP';
  if (name.includes('VOUCHER')) return 'VOUCHER';
  if (name.includes('PAYMENT') || name.includes('DISBURSEMENT')) return 'PAYMENT';
  return name;
};

// Use Prisma Client Extensions instead of deprecated $use middleware
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        const result = await query(args);
        
        if (model !== 'AuditLog' && ['create', 'update', 'delete', 'upsert'].includes(operation)) {
          const auditContext = (args as any)?.__auditContext;
          const userId = auditContext?.userId || 'SYSTEM';
          const userName = auditContext?.userName || 'SYSTEM ACTION';
          
          if (args && (args as any).__auditContext) {
            delete (args as any).__auditContext;
          }

          try {
            await basePrisma.auditLog.create({
              data: {
                userId: userId,
                userName: userName,
                action: mapAction(operation),
                module: mapModule(model),
                recordId: (result as any)?.id || 'UNKNOWN',
                recordNo: (result as any)?.prNumber || (result as any)?.poNumber || (result as any)?.rrNumber || (result as any)?.reportNo || (result as any)?.invoiceNo || (result as any)?.voucherNo || null,
                description: `${mapAction(operation)} on ${model}`,
                newData: result ? JSON.parse(JSON.stringify(result)) : null,
                timestamp: new Date()
              }
            });
          } catch (err) {
            console.error('Failed to write audit log:', err);
          }
        }
        
        return result;
      }
    }
  }
});

export default prisma;
