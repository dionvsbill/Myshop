import Link from "next/link";
import { ChevronRight, Flame, ShieldCheck, Truck, Star } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FeaturedSlider from "../components/FeaturedSlider";
import MobileBottomNav from "../components/MobileBottomNav";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const s = await createClient();
  const [{ data: cats }, { data: all }] = await Promise.all([
    s.from("categories").select("id,name,slug").limit(12),
    s.from("products").select("id,slug,title,price,compare_price,images,is_featured,rating,review_count,stock,created_at,categories(name)").eq("is_active", true).limit(100),
  ]);
  const products = all || [];
  const featured = [...products].sort((a: any, b: any) => Number(b.is_featured) - Number(a.is_featured) || Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 8);
  const deals = products.filter((p: any) => p.compare_price && Number(p.compare_price) > Number(p.price)).slice(0, 10);
  const rated = [...products].sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 10);
  const remaining = (p: any) => Number(p.stock || 0) > 0 ? Math.min(Number(p.stock), 9) : 0;

  const card = (p: any) => (
    <Link key={p.id} href={"/product/" + p.slug} className="group overflow-hidden rounded-md border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-white">
        <img src={p.images?.[0] || ""} alt={p.title} className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105" />
        {p.compare_price && Number(p.compare_price) > Number(p.price) && <span className="absolute left-2 top-2 bg-[#f68b1e] px-2 py-1 text-[10px] font-bold text-white">- {Math.round((1 - Number(p.price) / Number(p.compare_price)) * 100)}%</span>}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-sm">{p.title}</p>
        <p className="mt-2 text-lg font-bold">GHS {Number(p.price).toFixed(2)}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500"><Star size={12} className="fill-current text-[#f68b1e]" /> {Number(p.rating || 0).toFixed(1)} ({p.review_count || 0})</div>
        {remaining(p) > 0 && <><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-[#f68b1e]" style={{ width: (100 - Math.min(90, remaining(p) * 10)) + "%" }} /></div><p className="mt-1 text-[10px] font-semibold text-neutral-500">Only {remaining(p)} left</p></>}
      </div>
    </Link>
  );

  return (
    <>
      <Header />
      <main className="pb-20">
        <section className="container py-3"><div className="grid gap-3 lg:grid-cols-[220px_1fr]"><aside className="hidden rounded-md bg-white p-3 shadow-sm lg:block"><h3 className="border-b pb-3 text-sm font-bold">Categories</h3>{(cats || []).slice(0, 10).map((c: any) => <Link key={c.id} href={"/products?category=" + c.slug} className="flex items-center justify-between border-b py-3 text-sm hover:text-[#f68b1e]">{c.name}<ChevronRight size={14} /></Link>)}</aside><FeaturedSlider items={featured} /></div></section>
        <section className="container grid grid-cols-2 gap-2 sm:grid-cols-3"><div className="flex gap-2 rounded-md bg-white p-3 shadow-sm"><Truck size={22} className="text-[#f68b1e]" /><div><b className="text-sm">Fast delivery</b><p className="text-[11px] text-neutral-500">Track every order</p></div></div><div className="flex gap-2 rounded-md bg-white p-3 shadow-sm"><ShieldCheck size={22} className="text-[#f68b1e]" /><div><b className="text-sm">Secure shopping</b><p className="text-[11px] text-neutral-500">Protected checkout</p></div></div><div className="hidden gap-2 rounded-md bg-white p-3 shadow-sm sm:flex"><Flame size={22} className="text-[#f68b1e]" /><div><b className="text-sm">Hot deals</b><p className="text-[11px] text-neutral-500">Limited stock offers</p></div></div></section>
        <section className="container mt-4"><div className="rounded-md bg-[#111] p-4 text-white sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[#f68b1e]">LIMITED TIME</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">BLACK FRIDAY DEALS</h2><p className="mt-1 text-xs text-white/60">Big savings while stock lasts</p></div><Link href="/products" className="rounded-md bg-[#f68b1e] px-4 py-2 text-xs font-bold">Shop deals</Link></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{deals.slice(0, 5).map(card)}</div></div></section>
        <section className="container mt-5 rounded-md bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Recommended for you</h2><Link href="/products" className="text-xs font-bold text-[#f68b1e]">See all</Link></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">{rated.slice(0, 10).map(card)}</div></section>
        <section className="container mt-5 rounded-md bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">You may also like</h2><Link href="/products" className="text-xs font-bold text-[#f68b1e]">More</Link></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">{products.slice(10, 20).map(card)}</div></section>
      </main>
      <Footer /><MobileBottomNav />
    </>
  );
}