import api from './client';

export const procurementApi = {
  // Items
  getItems: async () => {
    const response = await api.get('/items');
    return response.data;
  },
  createItem: async (data: any) => {
    const response = await api.post('/items', data);
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },
  getSupplierSOA: async (id: string) => {
    const response = await api.get(`/suppliers/${id}/soa`);
    return response.data;
  },
  createSupplier: async (data: any) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  // Purchase Requisitions
  getPRs: async () => {
    const response = await api.get('/pr');
    return response.data;
  },
  getPRById: async (id: string) => {
    const response = await api.get(`/pr/${id}`);
    return response.data;
  },
  createPR: async (data: any) => {
    const response = await api.post('/pr', data);
    return response.data;
  },
  submitPR: async (id: string) => {
    const response = await api.post(`/pr/${id}/submit`);
    return response.data;
  },

  // Purchase Orders
  getPOs: async () => {
    const response = await api.get('/po');
    return response.data;
  },
  getPOById: async (id: string) => {
    const response = await api.get(`/po/${id}`);
    return response.data;
  },
  createPO: async (data: any) => {
    const response = await api.post('/po', data);
    return response.data;
  }
};
