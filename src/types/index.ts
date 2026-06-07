export interface SerializedProduct {
  id: string;
  name: string;
  barcode: string | null;
  price: number; // Stored as number for UI/Zustand calculations
  cost: number;  // Stored as number for UI/Zustand calculations
  stock: number;
  lowStockAlertLimit: number;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: SerializedProduct;
  quantity: number;
}

export interface HeldOrder {
  id: string;
  items: CartItem[];
  notes?: string;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  openingBalance: number;
}
