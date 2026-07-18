import {branches, inventory, movements, notifications, products, suppliers, transfers, users} from "@/data/mock-data";

const wait = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));
async function response<T>(data: T) { await wait(); return structuredClone(data); }

export const inventoryService = {
  getBranches: () => response(branches),
  getProducts: () => response(products),
  getInventory: () => response(inventory),
  getMovements: () => response(movements),
  getTransfers: () => response(transfers),
  getSuppliers: () => response(suppliers),
  getUsers: () => response(users),
  getNotifications: () => response(notifications)
};
