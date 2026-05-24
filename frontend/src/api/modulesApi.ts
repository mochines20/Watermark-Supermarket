import api from './client';

export const modulesApi = {
  // Receiving
  getReceivingDashboard: async () => (await api.get('/receiving/dashboard')).data,
  getDeliveries: async (params?: any) => (await api.get('/receiving/deliveries', { params })).data,
  getReceivingReports: async () => (await api.get('/receiving')).data,
  getReceivingReportById: async (id: string) => (await api.get(`/receiving/${id}`)).data,
  createReceivingReport: async (data: any) => (await api.post('/receiving', data)).data,
  getDiscrepancies: async () => (await api.get('/discrepancies')).data,
  getDiscrepancyById: async (id: string) => (await api.get(`/discrepancies/${id}`)).data,
  createDiscrepancy: async (data: any) => (await api.post('/discrepancies', data)).data,

  // Inventory
  getInventory: async () => (await api.get('/inventory')).data,
  getStockStatus: async () => (await api.get('/inventory/stock')).data,
  getInventoryAlerts: async () => (await api.get('/inventory/alerts')).data,
  getAuditLogs: async (params?: any) => {
    const cleanedParams = params ? { ...params } : {};
    Object.keys(cleanedParams).forEach((key) => {
      if (cleanedParams[key] === undefined || cleanedParams[key] === null) {
        delete cleanedParams[key];
      }
    });
    return (await api.get('/audit', { params: cleanedParams })).data;
  },
  postInventoryTransaction: async (data: any) => (await api.post('/inventory/transaction', data)).data,
  getInventoryTransactions: async (id: string) => (await api.get(`/inventory/${id}/transactions`)).data,
  logVariance: async (data: any) => (await api.post('/inventory/variance', data)).data,

  // AP
  getInvoices: async () => (await api.get('/ap/invoices')).data,
  getInvoiceById: async (id: string) => (await api.get(`/ap/invoices/${id}`)).data,
  createInvoice: async (data: any) => (await api.post('/ap/invoices', data)).data,
  getLedger: async () => (await api.get('/ap/ledger')).data,
  getAging: async () => (await api.get('/ap/aging')).data,

  // Vouchers
  getVouchers: async () => (await api.get('/vouchers')).data,
  getVoucherById: async (id: string) => (await api.get(`/vouchers/${id}`)).data,
  createVoucher: async (data: any) => (await api.post('/vouchers', data)).data,
  approveVoucher: async (id: string) => (await api.post(`/vouchers/${id}/approve`)).data,

  // Disbursements
  getPayments: async () => (await api.get('/disbursement')).data,
  createPayment: async (data: any) => (await api.post('/disbursement', data)).data,
  receiveOR: async (id: string, data: any) => (await api.post(`/disbursement/${id}/receive-or`, data)).data,

  // Users & Auth
  getUsers: async () => (await api.get('/auth/users')).data,
};
