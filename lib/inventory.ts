import type {InventoryBalance,ProductPackage,StockStatus} from "@/types";

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

export function postPackageInventory(inventory:InventoryBalance[],branchId:string,pkg:ProductPackage,packageQuantity:number,date:string){
  const deltas=new Map<string,number>();
  pkg.items.forEach(item=>deltas.set(item.productId,(deltas.get(item.productId)??0)-(item.quantity*packageQuantity)));
  deltas.set(pkg.returnProductId,(deltas.get(pkg.returnProductId)??0)+(pkg.returnQuantity*packageQuantity));
  return inventory.map(balance=>{
    if(balance.branchId!==branchId||!deltas.has(balance.productId))return balance;
    const current=balance.currentQuantity+(deltas.get(balance.productId)??0);const available=current-balance.reservedQuantity;
    return {...balance,currentQuantity:current,availableQuantity:available,inventoryValue:inventoryValue(current,balance.averageCost),lastMovementDate:date,status:getStockStatus(available,balance.minimumQuantity,balance.maximumQuantity)};
  });
}
