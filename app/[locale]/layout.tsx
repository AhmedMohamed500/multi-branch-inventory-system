import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";

export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) {
  const {locale}=await params;
  if (!['ar','en'].includes(locale)) notFound();
  const messages=(await import(`@/messages/${locale}.json`)).default;
  return <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>;
}
