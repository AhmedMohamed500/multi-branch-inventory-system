import type {InventoryBalance,ProductPackage,ProductPackageItem,StockStatus} from "@/types";

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
  return applyPackageIssueInventory(inventory,branchId,pkg.items.map(item=>({...item,quantity:item.quantity*packageQuantity})),pkg.returnProductId,pkg.returnQuantity*packageQuantity,date,1);
}

export function applyPackageIssueInventory(inventory:InventoryBalance[],branchId:string,items:ProductPackageItem[],returnProductId:string,returnQuantity:number,date:string,direction:1|-1=1){
  const deltas=new Map<string,number>();
  items.forEach(item=>deltas.set(item.productId,(deltas.get(item.productId)??0)-(item.quantity*direction)));
  deltas.set(returnProductId,(deltas.get(returnProductId)??0)+(returnQuantity*direction));
  return inventory.map(balance=>{
    if(balance.branchId!==branchId||!deltas.has(balance.productId))return balance;
    const current=balance.currentQuantity+(deltas.get(balance.productId)??0);const available=current-balance.reservedQuantity;
    return {...balance,currentQuantity:current,availableQuantity:available,inventoryValue:inventoryValue(current,balance.averageCost),lastMovementDate:date,status:getStockStatus(available,balance.minimumQuantity,balance.maximumQuantity)};
  });
}
