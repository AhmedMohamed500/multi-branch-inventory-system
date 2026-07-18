import InventoryApp from "@/components/inventory-app";

export default async function AppPage({params}:{params:Promise<{locale:"ar"|"en";section?:string[]}>}) {
  const {locale,section}=await params;
  return <InventoryApp locale={locale} section={section?.[0]??"dashboard"}/>;
}
