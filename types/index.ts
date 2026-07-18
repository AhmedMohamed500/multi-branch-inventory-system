export type Locale = "ar" | "en";
export type Status = "active" | "inactive";
export type StockStatus = "available" | "low" | "out" | "overstock";

export interface Branch {
  id: string; code: string; nameAr: string; nameEn: string;
  governorateAr: string; governorateEn: string; addressAr: string; addressEn: string;
  phone: string; managerName: string; status: Status; createdAt: string; updatedAt: string;
}

export interface Product {
  id: string; sku: string; barcode?: string; nameAr: string; nameEn: string;
  categoryId: string; categoryNameAr: string; categoryNameEn: string;
  unitId: string; unitNameAr: string; unitNameEn: string;
  purchasePrice: number; sellingPrice?: number; minimumStock: number; maximumStock?: number; imageUrl?: string;
  descriptionAr: string; descriptionEn: string; status: Status; createdAt: string; updatedAt: string;
}

export interface InventoryBalance {
  id: string; branchId: string; productId: string; currentQuantity: number; reservedQuantity: number;
  availableQuantity: number; minimumQuantity: number; maximumQuantity: number; averageCost: number;
  inventoryValue: number; lastMovementDate: string; status: StockStatus;
}

export interface Supplier { id: string; code: string; nameAr: string; nameEn: string; contact: string; phone: string; email: string; status: Status; }
export interface StockMovement { id: string; date: string; type: string; branchId: string; productId: string; quantity: number; reference: string; user: string; supplierName?: string; unitCost?: number; systemQuantity?: number; actualQuantity?: number; note?: string; }
export interface Transfer { id: string; number: string; fromBranchId: string; toBranchId: string; productId?: string; quantity?: number; date: string; status: "draft" | "sent" | "received" | "cancelled"; items: number; }
export interface StockIssueItem { productId: string; quantity: number; unitPrice: number; }
export interface StockIssue { id: string; number: string; date: string; branchId: string; customerName: string; issueType: "sale" | "internal"; notes: string; items: StockIssueItem[]; total: number; status: "posted" | "cancelled"; }
export interface ProductBarterIncomingItem { productId: string; quantity: number; }
export interface ProductBarter { id: string; number: string; date: string; branchId: string; customerName: string; mode?: "single" | "multi"; primaryProductId: string; primaryQuantity: number; outgoingItems?: ProductBarterIncomingItem[]; exchangeProductId: string; exchangeQuantity: number; incomingItems?: ProductBarterIncomingItem[]; exchangeDirection?: "in" | "out"; ratioBase: number; ratioExchange: number; notes: string; status: "posted" | "cancelled"; }
export interface User { id: string; name: string; email: string; role: string; branchId: string; status: Status; }
export interface Notification { id: string; titleAr: string; titleEn: string; date: string; read: boolean; }
export interface ApiResponse<T> { success: boolean; data: T; message?: string; }
export interface PaginatedResponse<T> { data: T[]; page: number; pageSize: number; total: number; totalPages: number; }
export interface ApiError { code: string; message: string; details?: Record<string, string>; }
