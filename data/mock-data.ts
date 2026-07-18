import type {Branch, InventoryBalance, Notification, Product, StockMovement, Supplier, Transfer, User} from "@/types";
import {availableQuantity, getStockStatus, inventoryValue} from "@/lib/inventory";

const now = "2026-07-15";
export const branches: Branch[] = [
  ["b1","CAI","القاهرة","Cairo","القاهرة","Cairo","مدينة نصر","Nasr City","01010000001","أحمد سالم"],
  ["b2","ALX","الإسكندرية","Alexandria","الإسكندرية","Alexandria","سموحة","Smouha","01010000002","منى علي"],
  ["b3","AST","أسيوط","Assiut","أسيوط","Assiut","شارع الجمهورية","El Gomhoria St.","01010000003","محمود حسن"],
  ["b4","DAM","دمنهور","Damanhour","البحيرة","Beheira","وسط البلد","Downtown","01010000004","سارة عادل"],
  ["b5","TAN","طنطا","Tanta","الغربية","Gharbia","شارع البحر","El Bahr St.","01010000005","خالد سمير"],
  ["b6","MAN","المنصورة","Mansoura","الدقهلية","Dakahlia","حي الجامعة","University District","01010000006","هبة عمر"]
].map(([id,code,nameAr,nameEn,governorateAr,governorateEn,addressAr,addressEn,phone,managerName]) => ({id,code,nameAr,nameEn,governorateAr,governorateEn,addressAr,addressEn,phone,managerName,status:"active",createdAt:now,updatedAt:now}));

const productRows = [
  ["p1","RIC-001","أرز","Rice","مواد غذائية","Food","كيلوجرام","Kilogram",32,42,100,900],
  ["p2","FLO-002","دقيق","Flour","مواد غذائية","Food","شيكارة","Bag",480,550,20,180],
  ["p3","SUG-003","سكر","Sugar","مواد غذائية","Food","كيلوجرام","Kilogram",28,36,120,800],
  ["p4","OIL-004","زيت","Oil","مواد غذائية","Food","لتر","Liter",58,68,80,600],
  ["p5","TEA-005","شاي","Tea","مشروبات","Beverages","كرتونة","Carton",720,820,15,120],
  ["p6","OXI-006","أوكسي باودر","Oxi Powder","منظفات","Cleaning","كرتونة","Carton",410,480,15,140],
  ["p7","OXG-007","أوكسي جل","Oxi Gel","منظفات","Cleaning","قطعة","Piece",75,90,40,350],
  ["p8","VIV-008","فيفا","Viva","منظفات","Cleaning","قطعة","Piece",52,65,50,400],
  ["p9","BRX-009","بريكس","Brix","منظفات","Cleaning","كرتونة","Carton",390,460,12,100]
] as const;
export const products: Product[] = productRows.map(([id,sku,nameAr,nameEn,categoryNameAr,categoryNameEn,unitNameAr,unitNameEn,purchasePrice,sellingPrice,minimumStock,maximumStock]) => ({
  id,sku,nameAr,nameEn,categoryId:categoryNameEn.toLowerCase(),categoryNameAr,categoryNameEn,unitId:unitNameEn.toLowerCase(),unitNameAr,unitNameEn,purchasePrice,sellingPrice,minimumStock,maximumStock,descriptionAr:"منتج تجريبي",descriptionEn:"Demo product",status:"active",createdAt:now,updatedAt:now
}));

export const inventory: InventoryBalance[] = branches.flatMap((branch, bi) => products.map((product, pi) => {
  const current = (bi * 73 + pi * 91 + 85) % 780;
  const reserved = (bi + pi) % 4 * 5;
  const available = availableQuantity(current, reserved);
  const maximum = product.maximumStock ?? 900;
  return {id:`i-${branch.id}-${product.id}`,branchId:branch.id,productId:product.id,currentQuantity:current,reservedQuantity:reserved,availableQuantity:available,minimumQuantity:product.minimumStock,maximumQuantity:maximum,averageCost:product.purchasePrice,inventoryValue:inventoryValue(current,product.purchasePrice),lastMovementDate:`2026-07-${String(15-(pi%7)).padStart(2,"0")}`,status:getStockStatus(available,product.minimumStock,maximum)};
}));

export const suppliers: Supplier[] = [
  {id:"s1",code:"SUP-01",nameAr:"شركة النيل للتوريدات",nameEn:"Nile Supplies",contact:"محمد فتحي",phone:"01020000001",email:"nile@example.com",status:"active"},
  {id:"s2",code:"SUP-02",nameAr:"مجموعة الدلتا",nameEn:"Delta Group",contact:"عمر علي",phone:"01020000002",email:"delta@example.com",status:"active"},
  {id:"s3",code:"SUP-03",nameAr:"تجارة الصعيد",nameEn:"Upper Egypt Trading",contact:"أحمد حمدي",phone:"01020000003",email:"upper@example.com",status:"active"},
  {id:"s4",code:"SUP-04",nameAr:"المتحدة للتوزيع",nameEn:"United Distribution",contact:"ليلى خالد",phone:"01020000004",email:"united@example.com",status:"inactive"}
];
export const movements: StockMovement[] = Array.from({length:18},(_,i)=>({id:`m${i+1}`,date:`2026-07-${String(16-(i%10)).padStart(2,"0")}`,type:["Opening Balance","Purchase Receipt","Stock Issue","Sale","Transfer"][i%5],branchId:branches[i%6].id,productId:products[i%9].id,quantity:(i+2)*7,reference:`MOV-${1001+i}`,user:["مدير النظام","أمين مخزن","مدير فرع"][i%3]}));
export const transfers: Transfer[] = Array.from({length:6},(_,i)=>({id:`t${i+1}`,number:`TR-${2026001+i}`,fromBranchId:branches[i%6].id,toBranchId:branches[(i+2)%6].id,productId:products[i%9].id,quantity:(i+1)*10,date:`2026-07-${10+i}`,status:(['draft','sent','received','cancelled'] as const)[i%4],items:1}));
export const users: User[] = [
  {id:"u1",name:"مدير النظام",email:"admin@demo.com",role:"Admin",branchId:"b1",status:"active"},
  {id:"u2",name:"مدير فرع القاهرة",email:"manager@demo.com",role:"Branch Manager",branchId:"b1",status:"active"},
  {id:"u3",name:"أمين مخزن",email:"keeper@demo.com",role:"Storekeeper",branchId:"b2",status:"active"},
  {id:"u4",name:"مراجع مخزون",email:"auditor@demo.com",role:"Auditor",branchId:"b3",status:"inactive"}
];
export const notifications: Notification[] = [
  {id:"n1",titleAr:"مخزون السكر منخفض في فرع أسيوط",titleEn:"Sugar stock is low in Assiut",date:"منذ 10 دقائق",read:false},
  {id:"n2",titleAr:"تم استلام التحويل TR-2026003",titleEn:"Transfer TR-2026003 received",date:"منذ ساعة",read:false},
  {id:"n3",titleAr:"اكتمل جرد فرع القاهرة",titleEn:"Cairo stock count completed",date:"أمس",read:true}
];
