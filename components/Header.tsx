"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, User, LogOut } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useEffect, useState } from "react";

export default function Header(){
 const [user,setUser]=useState<any>(null);
 const [cart,setCart]=useState(0);
 useEffect(()=>{
   const supabase=createClient();
   let mounted=true;
   supabase.auth.getUser().then(({data})=>{if(mounted)setUser(data.user)});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(mounted)setUser(session?.user??null)});
   return ()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
   if(!user){setCart(0);return}
   let mounted=true;
   const load=async()=>{const supabase=createClient();const {count}=await supabase.from("cart_items").select("id",{count:"exact",head:true});if(mounted)setCart(count||0)};
   load();
   return ()=>{mounted=false};
 },[user]);
 async function signOut(){await createClient().auth.signOut();location.href="/"}
 return <header className="sticky top-0 z-50 border-b bg-white"><div className="container flex h-16 items-center justify-between gap-4"><div className="flex items-center gap-3"><Menu className="md:hidden"/><Link href="/" className="text-xl font-bold">Myshop</Link><nav className="hidden gap-5 md:flex"><Link href="/products">Products</Link><Link href="/products">Categories</Link><Link href="/products">Deals</Link></nav></div><form action="/products" className="hidden w-96 md:flex"><div className="flex w-full items-center rounded-lg border px-3"><Search size={17}/><input name="q" className="w-full p-2 outline-none" placeholder="Search products"/></div></form><div className="flex items-center gap-4"><Link href="/cart" className="relative"><ShoppingCart size={20}/>{cart>0&&<span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 text-xs text-white">{cart}</span>}</Link>{user?<><Link href="/account"><User size={20}/></Link><button aria-label="Sign out" onClick={signOut}><LogOut size={20}/></button></>:<Link href="/login">Login</Link>}</div></div></header>;
}