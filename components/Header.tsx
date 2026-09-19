"use client";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useEffect,useState } from "react";

export default function Header(){
 const [user,setUser]=useState<any>(null),[cart,setCart]=useState(0),[open,setOpen]=useState(false);
 useEffect(()=>{const s=createClient();let alive=true;s.auth.getUser().then(({data})=>alive&&setUser(data.user));const {data:{subscription}}=s.auth.onAuthStateChange((_e,session)=>alive&&setUser(session?.user??null));return()=>{alive=false;subscription.unsubscribe()}},[]);
 useEffect(()=>{if(!user){setCart(0);return}let alive=true;(async()=>{const {count}=await createClient().from("cart_items").select("id",{count:"exact",head:true});if(alive)setCart(count||0)})();return()=>{alive=false}},[user]);
 return <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl">
  <div className="bg-zinc-950 text-center text-[11px] font-semibold tracking-wide text-white"><div className="container py-2">Free delivery on selected orders · Secure checkout</div></div>
  <div className="container flex h-[74px] items-center gap-3">
   <button className="rounded-xl p-2 md:hidden" onClick={()=>setOpen(!open)} aria-label="Menu">{open?<X/>:<Menu/>}</button>
   <Link href="/" className="text-[25px] font-black tracking-[-.06em]">MYSHOP<span className="text-zinc-400">.</span></Link>
   <nav className="ml-8 hidden items-center gap-7 text-[13px] font-semibold md:flex"><Link href="/products">Shop</Link><Link href="/products">New arrivals</Link><Link href="/products">Collections</Link></nav>
   <form action="/products" className="ml-auto hidden w-full max-w-[390px] lg:block"><div className="flex h-11 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-zinc-900/5"><Search size={17} className="text-zinc-400"/><input name="q" placeholder="Search products..." className="w-full bg-transparent px-3 text-sm outline-none"/></div></form>
   <div className="ml-auto flex items-center gap-0.5 lg:ml-4"><Link href="/products" className="rounded-xl p-2.5 hover:bg-zinc-100 lg:hidden"><Search size={20}/></Link><button className="hidden rounded-xl p-2.5 hover:bg-zinc-100 sm:block" aria-label="Wishlist"><Heart size={20}/></button>{user?<Link href="/account" className="rounded-xl p-2.5 hover:bg-zinc-100"><User size={20}/></Link>:<Link href="/login" className="hidden px-3 py-2 text-sm font-bold sm:block">Sign in</Link>}<Link href="/cart" className="relative rounded-xl p-2.5 hover:bg-zinc-100"><ShoppingBag size={21}/>{cart>0&&<span className="absolute right-0 top-0 min-w-5 rounded-full bg-zinc-950 px-1 text-center text-[10px] font-bold leading-5 text-white">{cart}</span>}</Link></div>
  </div>
  {open&&<div className="border-t bg-white md:hidden"><nav className="container flex flex-col py-2 text-sm font-semibold"><Link className="border-b py-4" href="/products" onClick={()=>setOpen(false)}>Shop</Link><Link className="border-b py-4" href="/products" onClick={()=>setOpen(false)}>New arrivals</Link><Link className="border-b py-4" href="/products" onClick={()=>setOpen(false)}>Collections</Link><Link className="py-4" href={user?"/account":"/login"} onClick={()=>setOpen(false)}>{user?"My account":"Sign in"}</Link></nav></div>}
 </header>
}
