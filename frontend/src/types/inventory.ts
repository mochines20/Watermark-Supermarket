export interface InventoryItem {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  unit: string;
  standardCost: number | string;
  reorderPoint: number;
  stockStatus: 'NORMAL' | 'LOW_STOCK' | 'CRITICAL';
  qtyOnHand: number;
  supplierName?: string;
}

export interface InventoryTransaction {
  id: string;
  transactionType: 'ADD' | 'DEDUCT' | 'PHYSICAL_COUNT';
  quantity: number;
  previousQty: number;
  newQty: number;
  variance?: number;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}
