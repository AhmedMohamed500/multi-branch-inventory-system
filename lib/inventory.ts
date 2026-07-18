import type {StockStatus} from "@/types";

export function availableQuantity(current: number, reserved: number) {
  return current - reserved;
}

export function inventoryValue(current: number, averageCost: number) {
  return current * averageCost;
}

export function getStockStatus(available: number, minimum: number, maximum: number): StockStatus {
  if (available <= 0) return "out";
  if (available < minimum) return "low";
  if (available > maximum) return "overstock";
  return "available";
}

export function validateTransfer(fromBranchId: string, toBranchId: string, quantity: number, available: number) {
  if (fromBranchId === toBranchId) return false;
  return quantity > 0 && quantity <= available;
}
