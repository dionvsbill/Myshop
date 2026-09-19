"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronDown } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = createClient();
    s.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = s.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return setCart(0);
    createClient().from("cart_items").select("id", { count: "exact", head: true }).then(({ count }) => setCart(count || 0));
  }, [user]);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#f68b1e] text-white">
        <div className="container flex h-8 items-center justify-between text-[11px] font-semibold">
          <span>Free delivery on selected orders</span><span className="hidden sm:block">Secure payments · GHS pricing</span><span>Help Centre</span>
        </div>
      </div>
      <div className="bg-[#f68b1e] text-white shadow-md">
        <div className="container flex min-h-[66px] items-center gap-3 py-2">
          <button className="rounded-md p-2 hover:bg-black/10 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <Link href="/" className="shrink-0 text-[25px] font-black tracking-[-.06em]">MYSHOP</Link>
          <form action="/products" className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white text-zinc-800 shadow-sm">
            <Search size={19} className="ml-3 shrink-0 text-zinc-400" />
            <input name="q" placeholder="Search products, brands and categories" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
            <button className="h-full bg-[#f68b1e] px-5 text-sm font-bold text-white hover:bg-[#df7710]">Search</button>
          </form>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href={user ? "/account" : "/login"} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-black/10">
              <User size={21}/><span className="hidden lg:block text-xs font-bold">{user ? "Account" : "Sign In"}</span><ChevronDown size={13} className="hidden lg:block"/>
            </Link>
            <button className="rounded-md p-2.5 hover:bg-black/10"><Heart size={21}/></button>
            <Link href="/cart" className="relative rounded-md p-2.5 hover:bg-black/10">
              <ShoppingBag size={22}/>
              {cart > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-white px-1 text-center text-[10px] font-black leading-5 text-[#f68b1e]">{cart}</span>}
            </Link>
          </div>
        </div>
        <nav className="hidden border-t border-white/15 md:block">
          <div className="container flex h-10 items-center gap-7 text-xs font-bold">
            <Link href="/products" className="hover:underline">Categories</Link>
            <Link href="/products" className="hover:underline">Shop</Link>
            <Link href="/products" className="hover:underline">New Arrivals</Link>
            <Link href="/products" className="hover:underline">Deals</Link>
          </div>
        </nav>
      </div>
      {open && <div className="border-b bg-white shadow-lg md:hidden"><nav className="container grid gap-1 py-3">{["Categories","Shop","New Arrivals","Deals","Account","Cart"].map(x => <Link key={x} href={x==="Account"?(user?"/account":"/login"):x==="Cart"?"/cart":"/products"} onClick={()=>setOpen(false)} className="rounded-md px-4 py-3 text-sm font-semibold hover:bg-orange-50">{x}</Link>)}</nav></div>}
    </header>
  );
}