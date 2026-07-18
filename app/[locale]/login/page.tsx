"use client";

import {useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useTranslations} from "next-intl";
import {Boxes, Eye, EyeOff, Languages, LockKeyhole, Mail} from "lucide-react";

export default function LoginPage() {
  const t=useTranslations();
  const {locale}=useParams<{locale:string}>();
  const router=useRouter();
  const [email,setEmail]=useState("admin@demo.com");
  const [password,setPassword]=useState("Demo@123");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");

  function submit(e:React.FormEvent) {
    e.preventDefault();
    if (email!=="admin@demo.com" || password!=="Demo@123") {setError(locale==="ar"?"بيانات الدخول غير صحيحة":"Invalid demo credentials");return;}
    localStorage.setItem("demo-session","true");
    router.push(`/${locale}/app`);
  }

  function switchLanguage(){const next=locale==="ar"?"en":"ar";localStorage.setItem("locale",next);router.push(`/${next}/login`);}

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#d1fae5,_transparent_40%),radial-gradient(circle_at_bottom_left,_#e0e7ff,_transparent_38%)] p-5 dark:bg-slate-950">
    <button onClick={switchLanguage} className="btn-secondary absolute left-5 top-5"><Languages size={17}/>{locale==="ar"?"English":"العربية"}</button>
    <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-6xl items-center justify-center">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 md:grid-cols-2">
        <section className="hidden bg-slate-900 p-12 text-white md:flex md:flex-col md:justify-between">
          <div className="flex items-center gap-3"><span className="rounded-2xl bg-brand-500 p-3"><Boxes/></span><strong className="text-xl">{t("appName")}</strong></div>
          <div><h2 className="text-4xl font-bold leading-tight">{locale==="ar"?"كل مخزونك، في مكان واحد.":"All your inventory, in one place."}</h2><p className="mt-4 text-slate-300">{locale==="ar"?"رؤية دقيقة لأرصدة 6 فروع وحركاتها اليومية.":"Clear visibility across 6 branches and their daily operations."}</p></div>
          <p className="text-sm text-slate-400">Multi-Branch Inventory System · 2026</p>
        </section>
        <section className="p-8 md:p-12">
          <div className="mb-8 md:hidden"><Boxes className="text-brand-600" size={36}/></div>
          <p className="text-sm font-semibold text-brand-600">{t("demo")}</p><h1 className="mt-2 text-3xl font-bold">{t("loginTitle")}</h1><p className="mt-2 text-slate-500">{t("loginHint")}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-medium">{t("email")}</span><div className="relative"><Mail className="absolute start-3 top-3 text-slate-400" size={19}/><input className="input ps-10" value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></div></label>
            <label className="block"><span className="mb-2 block text-sm font-medium">{t("password")}</span><div className="relative"><LockKeyhole className="absolute start-3 top-3 text-slate-400" size={19}/><input className="input px-10" value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} required/><button type="button" aria-label="Show password" onClick={()=>setShow(!show)} className="absolute end-3 top-3 text-slate-400">{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
            {error&&<p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full">{t("login")}</button>
          </form>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><strong>{t("demoCredentials")}</strong><p className="mt-2 text-slate-500">admin@demo.com · Demo@123</p></div>
        </section>
      </div>
    </div>
  </main>;
}
