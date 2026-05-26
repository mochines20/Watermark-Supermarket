import fs from 'fs';
import path from 'path';

type Where = any;

const dataPath = path.resolve(__dirname, '..', '..', 'dev-data.json');
const raw = fs.readFileSync(dataPath, 'utf-8');
const seed = JSON.parse(raw);

const collections: Record<string, any> = Object.assign({}, seed, { auditLogs: [] });

const modelMap: Record<string, string> = {
  User: 'users',
  Supplier: 'suppliers',
  Item: 'items',
  PurchaseOrder: 'pos',
  ReceivingReport: 'rrs',
  PurchaseRequisition: 'prs',
  SupplierInvoice: 'invoices',
  Counter: 'counters',
  APLedgerEntry: 'aPLedgerEntries',
  DiscrepancyReport: 'discrepancies',
  VoucherPackage: 'vouchers',
  Payment: 'payments',
  InventoryStock: 'inventoryStock',
  InventoryTransaction: 'inventoryTransaction',
  AuditLog: 'auditLogs'
};

const now = () => new Date().toISOString();

const evalWhere = (item: any, where?: Where) => {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    const cond = where[key];
    const value = item[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if (cond.in) {
        if (!cond.in.includes(value)) return false;
      } else if (cond.gte !== undefined || cond.lt !== undefined) {
        const d = new Date(value).getTime();
        if (cond.gte !== undefined && d < new Date(cond.gte).getTime()) return false;
        if (cond.lt !== undefined && d >= new Date(cond.lt).getTime()) return false;
      } else if (cond.equals !== undefined) {
        if (value !== cond.equals) return false;
      } else {
        // fallback: deep equality for simple shapes
        for (const k2 of Object.keys(cond)) {
          if ((cond as any)[k2] !== value) return false;
        }
      }
    } else {
      if (value !== cond) return false;
    }
  }
  return true;
};

function collectionFor(model: string) {
  const key = modelMap[model] || (model.toLowerCase() + 's');
  if (!(key in collections)) {
    // initialize empty array or object for counters
    collections[key] = Array.isArray(seed[key]) ? seed[key] : seed[key] || [];
  }
  return collections[key];
}

function makeModel(modelName: string) {
  const col = collectionFor(modelName);

  const isCounter = modelName === 'Counter' || modelName === 'counter';

  return {
    findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
      if (isCounter && typeof col === 'object' && !Array.isArray(col)) {
        // return counters as array of { type, value }
        return Object.keys(col).map((k) => ({ type: k, value: col[k] }));
      }
      let res = Array.isArray(col) ? col.slice() : [];
      res = res.filter((it) => evalWhere(it, where));
      if (orderBy && typeof orderBy === 'object') {
        // naive order by first key
        const key = Object.keys(orderBy)[0];
        res.sort((a, b) => (a[key] > b[key] ? 1 : -1));
      }
      if (skip) res = res.slice(skip);
      if (take) res = res.slice(0, take);
      return res;
    },

    findUnique: async ({ where, include }: any) => {
      if (!where) return null;
      const res = Array.isArray(col) ? col.find((it) => evalWhere(it, where)) : null;
      return res || null;
    },

    findFirst: async ({ where, include }: any = {}) => {
      const res = Array.isArray(col) ? col.find((it) => evalWhere(it, where)) : null;
      return res || null;
    },

    create: async ({ data }: any) => {
      if (isCounter && typeof col === 'object' && !Array.isArray(col)) {
        // counters create not typical; ignore
        return data;
      }
      const record = Object.assign({ createdAt: now(), id: data.id || `${modelName.toLowerCase()}-${Math.random().toString(36).slice(2,9)}` }, data);
      if (Array.isArray(col)) col.push(record);
      return record;
    },

    update: async ({ where, data }: any) => {
      if (isCounter && typeof col === 'object' && !Array.isArray(col)) {
        const type = where.type;
        col[type] = data.value ?? col[type];
        return { type, value: col[type] };
      }
      if (!where) return null;
      const idx = Array.isArray(col) ? col.findIndex((it) => evalWhere(it, where)) : -1;
      if (idx === -1) return null;
      col[idx] = Object.assign({}, col[idx], data, { updatedAt: now() });
      return col[idx];
    },

    updateMany: async ({ where, data }: any) => {
      let count = 0;
      if (!where) return { count: 0 };
      for (let i = 0; i < col.length; i++) {
        if (evalWhere(col[i], where)) {
          col[i] = Object.assign({}, col[i], data, { updatedAt: now() });
          count++;
        }
      }
      return { count };
    },

    delete: async ({ where }: any) => {
      const idx = Array.isArray(col) ? col.findIndex((it) => evalWhere(it, where)) : -1;
      if (idx === -1) return null;
      const removed = col.splice(idx, 1)[0];
      return removed;
    },

    upsert: async ({ where, create, update }: any) => {
      // counters upsert
      if (isCounter && typeof col === 'object' && !Array.isArray(col)) {
        const type = where.type;
        if (col[type] !== undefined) {
          col[type] = update?.data?.value ?? col[type];
        } else {
          col[type] = create?.data?.value ?? 0;
        }
        return { type, value: col[type] };
      }
      const existing = Array.isArray(col) ? col.find((it) => evalWhere(it, where)) : null;
      if (existing) {
        Object.assign(existing, update?.data || {});
        return existing;
      }
      const record = Object.assign({ createdAt: now(), id: create?.data?.id || `${modelName.toLowerCase()}-${Math.random().toString(36).slice(2,9)}` }, create?.data || {});
      if (Array.isArray(col)) col.push(record);
      return record;
    },

    count: async ({ where }: any = {}) => {
      if (isCounter && typeof col === 'object' && !Array.isArray(col)) return Object.keys(col).length;
      return Array.isArray(col) ? col.filter((it) => evalWhere(it, where)).length : 0;
    }
  };
}

const handler: any = {
  get(target: any, prop: string) {
    if (prop === '$transaction') return async (cb: any) => cb(mockPrisma);
    if (prop === '$disconnect') return async () => {};
    if (prop === '$connect') return async () => {};
    if (prop === 'auditLog') return makeModel('AuditLog');
    // return model handlers
    return makeModel(prop.charAt(0).toUpperCase() + prop.slice(1));
  }
};

const mockPrisma = new Proxy({}, handler);

export default mockPrisma;
