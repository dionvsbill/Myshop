import Link from "next/link";
import { ArrowRight, Check, PackageOpen, ShieldCheck, Truck } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FeaturedSlider from "../components/FeaturedSlider";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
 const s=await createClient();
 const [{data:cats},{data:all}] = await Promise.all([
  s.from("categories").select("id,name,slug").limit(8),
  s.from("products").select("id,slug,title,price,images,is_featured,rating,review_count,created_at,category_id,categories(name)").eq("is_active",true).limit(80)
 ]);
 const now=Date.now();
 const scored=(all||[]).map((p:any)=>({p,score:(p.is_featured?45:0)+Math.min(25,Number(p.rating||0)*5)+Math.min(15,Math.log10(Number(p.review_count||0)+1)*8)+Math.max(0,15-Math.floor((now-new Date(p.created_at).getTime())/86400000))})).sort((a,b)=>b.score-a.score).map(x=>x.p);
 const featured=scored.slice(0,7);
 const sections=[["Trending now",scored.slice(0,8)],["New & noteworthy",[...scored].sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at)).slice(0,8)],["Highly rated",[...scored].sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)).slice(0,8)]];
 return <><Header/><main>
  <section className="bg-zinc-950 py-8 text-white sm:py-12"><div className="container"><FeaturedSlider items={featured}/></div></section>
  <section className="border-b bg-white"><div className="container grid gap-6 py-7 sm:grid-cols-3"><div className="flex gap-3"><Truck size={22}/><div><p className="font-semibold">Reliable delivery</p><p className="text-sm text-neutral-500">Track your orders from account.</p></div></div><div className="flex gap-3"><ShieldCheck size={22}/><div><p className="font-semibold">Secure shopping</p><p className="text-sm text-neutral-500">Protected account and checkout.</p></div></div><div className="flex gap-3"><Check size={22}/><div><p className="font-semibold">Simple checkout</p><p className="text-sm text-neutral-500">Fast and mobile friendly.</p></div></div></div></section>
  <section className="container py-14"><div className="flex items-end justify-between"><div><p className="eyebrow">Explore</p><h2 className="section-title mt-2">Shop by category</h2></div><Link href="/products" className="text-sm font-bold">View all →</Link></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{(cats||[]).map((c:any)=><Link key={c.id} href={"/products?category="+c.slug} className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg"><div className="grid h-20 place-items-center rounded-xl bg-zinc-100 text-2xl font-black text-zinc-400">{c.name?.slice(0,1)}</div><p className="mt-3 truncate text-sm font-bold">{c.name}</p></Link>)}</div></section>
  {(sections).map(([title,items]:any)=><section key={title} className="border-t bg-white py-14"><div className="container"><div className="flex items-end justify-between"><div><p className="eyebrow">Curated</p><h2 className="section-title mt-2">{title}</h2></div><Link href="/products" className="text-sm font-bold">See more →</Link></div><div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map((p:any)=><Link key={p.id} href={"/product/"+p.slug} className="group"><div className="relative aspect-[.92] overflow-hidden rounded-2xl bg-zinc-100"><img src={p.images?.[0]||""} alt={p.title} className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.04]"/>{p.is_featured&&<span className="absolute left-3 top-3 rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Featured</span>}</div><p className="mt-3 line-clamp-1 text-sm font-bold">{p.title}</p><p className="mt-1 text-sm font-black">GHS {Number(p.price).toFixed(2)}</p><p className="mt-1 text-xs text-zinc-500">★ {Number(p.rating||0).toFixed(1)} · {p.review_count||0} reviews</p></Link>)}</div></div></section>)}
  <section className="container py-14"><div className="rounded-[28px] bg-zinc-100 p-8 sm:p-12"><p className="eyebrow">Myshop</p><h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-4xl">A storefront that adapts what you see instead of repeating one product.</h2><Link href="/products" className="btn-primary mt-7">Explore catalogue <ArrowRight size={17}/></Link></div></section>
 </main><Footer/></>;
}