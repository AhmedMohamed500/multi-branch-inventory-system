import "./globals.css";
import type {Metadata} from "next";

export const metadata: Metadata = {title:"Multi-Branch Inventory",description:"Frontend inventory management demo"};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ar" dir="rtl" suppressHydrationWarning><body>{children}</body></html>;
}
