import Link from "next/link";
import { ArrowRight, Check, PackageOpen, ShieldCheck, Truck } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const s = await createClient();
  const [{ data: cats }, { data: products }] = await Promise.all([
    s.from("categories").select("*").limit(6),
    s.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(8),
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-neutral-950 text-white">
          <div className="container grid min-h-[560px] items-center gap-10 py-20 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-neutral-400">The Myshop collection</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Shop better. Live better.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-neutral-300">
                Discover carefully selected products, simple checkout and reliable order management in one modern storefront.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200">
                  Shop all products <ArrowRight size={17} />
                </Link>
                <Link href="/register" className="rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold hover:bg-white/10">
                  Create account
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-6 text-sm text-neutral-300">
                {["Secure checkout", "Customer accounts", "GHS pricing"].map((x) => (
                  <span key={x} className="flex items-center gap-2"><Check size={16} />{x}</span>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-neutral-800 to-neutral-950 p-8">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative grid aspect-square place-items-center rounded-[1.5rem] border border-white/10 bg-white/5">
                <PackageOpen size={96} strokeWidth={1} className="text-white/50" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-white">
          <div className="container grid gap-6 py-7 sm:grid-cols-3">
            <div className="flex gap-3"><Truck className="mt-0.5" size={22}/><div><p className="font-semibold">Reliable delivery</p><p className="text-sm text-neutral-500">Track your orders from account.</p></div></div>
            <div className="flex gap-3"><ShieldCheck className="mt-0.5" size={22}/><div><p className="font-semibold">Secure shopping</p><p className="text-sm text-neutral-500">Your account stays protected.</p></div></div>
            <div className="flex gap-3"><Check className="mt-0.5" size={22}/><div><p className="font-semibold">Simple checkout</p><p className="text-sm text-neutral-500">Fast, focused and mobile friendly.</p></div></div>
          </div>
        </section>

        <section className="container py-16">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Browse</p><h2 className="mt-2 text-3xl font-black tracking-tight">Shop by category</h2></div>
            <Link href="/products" className="hidden text-sm font-semibold sm:block">View all →</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {(cats || []).map((c) => (
              <Link key={c.id} href={"/products?category=" + c.slug} className="group overflow-hidden rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="grid h-24 place-items-center rounded-xl bg-neutral-100 text-2xl font-black text-neutral-400">{c.name?.slice(0, 1)}</div>
                <p className="mt-4 font-semibold">{c.name}</p>
                <p className="mt-1 text-xs text-neutral-500">Explore collection</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Featured</p><h2 className="mt-2 text-3xl font-black tracking-tight">Customer favourites</h2></div>
              <Link href="/products" className="text-sm font-semibold">Shop all →</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {(products || []).map((p) => (
                <Link key={p.id} href={"/product/" + p.slug} className="group">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><PackageOpen className="text-neutral-300" size={48}/></div>}
                  </div>
                  <p className="mt-4 line-clamp-1 text-sm font-semibold">{p.title}</p>
                  <p className="mt-1 font-bold">GHS {Number(p.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="rounded-[2rem] bg-neutral-100 p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Made for modern shopping</p>
            <div className="mt-4 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Everything you need from discovery to delivery, without the clutter.</h2>
              <Link href="/products" className="inline-flex w-fit items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3.5 text-sm font-bold text-white">Start shopping <ArrowRight size={17}/></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
