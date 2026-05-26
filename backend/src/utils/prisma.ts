import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

// Allow an in-memory fake DB for end-to-end dev flows using backend/dev-data.json
if (process.env.USE_FAKE_DB === 'true' || process.env.USE_FAKE_DB === '1') {
  // When using fake DB, load the lightweight mock implementation
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const mock = require('./mockPrisma').default;

  // Wrap mock to inject audit log entries on mutating operations
  const mutating = new Set(['create', 'update', 'delete', 'upsert']);

  const handler: any = {
    get(target: any, prop: string) {
      if (prop === '$transaction') return async (cb: any) => cb(prisma);
      if (prop === '$disconnect') return async () => {};
      if (prop === '$connect') return async () => {};
      // model access
      const modelProxy = new Proxy({}, {
        get(_, method: string) {
          return async (args: any) => {
            const impl = (target as any)[prop];
            if (!impl || typeof impl[method] !== 'function') throw new Error(`Method ${String(method)} not implemented on mock model ${prop}`);
            const result = await impl[method](args);
            try {
              if (method && mutating.has(method) && prop !== 'auditLog') {
                // Best-effort audit log entry
                await target.auditLog.create({ data: {
                  userId: args?.__auditContext?.userId || 'SYSTEM',
                  userName: args?.__auditContext?.userName || 'SYSTEM ACTION',
                  action: method.toUpperCase(),
                  module: prop.toUpperCase(),
                  recordId: (result as any)?.id || 'UNKNOWN',
                  recordNo: (result as any)?.prNumber || (result as any)?.poNumber || (result as any)?.rrNumber || (result as any)?.invoiceNo || (result as any)?.voucherNo || null,
                  description: `${method.toUpperCase()} on ${prop}`,
                  newData: result ? JSON.parse(JSON.stringify(result)) : null,
                  timestamp: new Date()
                }});
              }
            } catch (err) {
              // don't let audit failures block main flow
              // eslint-disable-next-line no-console
              console.error('Mock audit write failed', err);
            }
            return result;
          };
        }
      });
      return modelProxy;
    }
  };

  const prisma: any = new Proxy(mock, handler);

  export default prisma;
}

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
