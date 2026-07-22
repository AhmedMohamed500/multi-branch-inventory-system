import {describe,expect,it} from "vitest";
import type {InventoryBalance,ProductPackage} from "@/types";
import {applyPackageIssueInventory,availableQuantity,getStockStatus,inventoryValue,postPackageInventory,validateTransfer} from "./inventory";

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

const productIds=["oil","tea","pasta","flour","used-oil"];
const inventory:InventoryBalance[]=productIds.map(productId=>({id:`cairo-${productId}`,branchId:"cairo",productId,currentQuantity:100,reservedQuantity:0,availableQuantity:100,minimumQuantity:10,maximumQuantity:500,averageCost:1,inventoryValue:100,lastMovementDate:"2026-07-18",status:"available"}));
const khairElBeit:ProductPackage={id:"pkg-1",code:"PKG-001",nameAr:"خير البيت",nameEn:"Khair El Beit",items:[{productId:"oil",quantity:2},{productId:"tea",quantity:1},{productId:"pasta",quantity:1},{productId:"flour",quantity:1}],returnProductId:"used-oil",returnQuantity:6,status:"active",createdAt:"2026-07-19"};

describe("package inventory posting",()=>{
  it("deducts Khair El Beit components and adds 6kg used oil",()=>{
    const result=postPackageInventory(inventory,"cairo",khairElBeit,1,"2026-07-19");
    const stock=(id:string)=>result.find(x=>x.productId===id)?.currentQuantity;
    expect(stock("oil")).toBe(98);expect(stock("tea")).toBe(99);expect(stock("pasta")).toBe(99);expect(stock("flour")).toBe(99);expect(stock("used-oil")).toBe(106);
  });
  it("deducts the branch and therefore the company total",()=>{
    const alex:InventoryBalance[]=productIds.map(productId=>({id:`alex-${productId}`,branchId:"alex",productId,currentQuantity:50,reservedQuantity:0,availableQuantity:50,minimumQuantity:10,maximumQuantity:500,averageCost:1,inventoryValue:50,lastMovementDate:"2026-07-18",status:"available"}));
    const result=postPackageInventory([...inventory,...alex],"cairo",khairElBeit,1,"2026-07-19");
    const companyStock=(id:string)=>result.filter(x=>x.productId===id).reduce((sum,x)=>sum+x.currentQuantity,0);
    expect(companyStock("oil")).toBe(148);expect(companyStock("tea")).toBe(149);expect(companyStock("pasta")).toBe(149);expect(companyStock("flour")).toBe(149);expect(companyStock("used-oil")).toBe(156);
  });
  it("reverses an issued package before editing or cancelling it",()=>{
    const posted=postPackageInventory(inventory,"cairo",khairElBeit,1,"2026-07-19");
    const reversed=applyPackageIssueInventory(posted,"cairo",[{productId:"oil",quantity:2},{productId:"tea",quantity:1},{productId:"pasta",quantity:1},{productId:"flour",quantity:1}],"used-oil",6,"2026-07-20",-1);
    const stock=(id:string)=>reversed.find(x=>x.productId===id)?.currentQuantity;
    expect(stock("oil")).toBe(100);expect(stock("tea")).toBe(100);expect(stock("pasta")).toBe(100);expect(stock("flour")).toBe(100);expect(stock("used-oil")).toBe(100);
  });
});
