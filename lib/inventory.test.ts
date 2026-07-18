import {describe,expect,it} from "vitest";
import {availableQuantity,getStockStatus,inventoryValue,validateTransfer} from "./inventory";

describe("inventory calculations",()=>{
  it("calculates available quantity",()=>expect(availableQuantity(500,35)).toBe(465));
  it("calculates inventory value",()=>expect(inventoryValue(100,32)).toBe(3200));
  it("detects stock status",()=>{
    expect(getStockStatus(0,10,100)).toBe("out");
    expect(getStockStatus(5,10,100)).toBe("low");
    expect(getStockStatus(120,10,100)).toBe("overstock");
    expect(getStockStatus(50,10,100)).toBe("available");
  });
  it("validates transfers",()=>{
    expect(validateTransfer("b1","b1",5,10)).toBe(false);
    expect(validateTransfer("b1","b2",0,10)).toBe(false);
    expect(validateTransfer("b1","b2",11,10)).toBe(false);
    expect(validateTransfer("b1","b2",5,10)).toBe(true);
  });
});
