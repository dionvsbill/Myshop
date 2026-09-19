"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronDown } from "lucide-react";
import { createClient } from "../lib/supabase/client";
import styles from "./header.module.css";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<any>(null); const [cart,setCart]=useState(0); const [open,setOpen]=useState(false);
  useEffect(()=>{const s=createClient();s.auth.getUser().then(({data})=>setUser(data.user));const {data:{subscription}}=s.auth.onAuthStateChange((_e,session)=>setUser(session?.user??null));return()=>subscription.unsubscribe()},[]);
  useEffect(()=>{if(!user)return setCart(0);createClient().from("cart_items").select("id",{count:"exact",head:true}).then(({count})=>setCart(count||0))},[user]);
  const avatarUrl=user?.user_metadata?.avatar_url||user?.user_metadata?.picture; const initial=(user?.email||"A").slice(0,1).toUpperCase();
  return <header className={styles.header}><div className={styles.headerInner}><div className={styles.headerLeft}>
    <button aria-label="Open menu" className={styles.hamburger} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button>
    <Link href="/"><Image src="/logo.png" alt="Myshop" width={100} height={32} className={styles.logo}/></Link>
    <nav className={styles.nav}><Link className={styles.navLink} href="/products">Shop</Link><Link className={styles.navLink} href="/products">New Arrivals</Link><Link className={styles.navLink} href="/products">Deals</Link></nav>
  </div><div className={styles.headerRight}>
    <form action="/products" className={styles.searchBar}><Search size={16}/><input name="q" className={styles.searchInput} placeholder="Search products..." /></form>
    <Link href="/cart" className={styles.cartIcon} aria-label="Cart"><ShoppingBag size={21}/>{cart>0&&<span className={styles.cartBadge}>{cart}</span>}</Link>
    <Link href={user?"/account":"/login"} aria-label="Account">{avatarUrl?<img src={avatarUrl} alt="Profile" className={styles.avatar}/>:<span className={styles.avatarFallback}>{initial}</span>}</Link>
    <Link href={user?"/account":"/login"} className={styles.accountLabel}>{user?"Account":"Sign In"}<ChevronDown size={13}/></Link>
    <button className={styles.hamburger} aria-label="Menu" onClick={()=>setOpen(!open)}><Menu size={22}/></button>
  </div></div>{open&&<div className={styles.mobileMenu}><nav className={styles.mobileNav}>{["Categories","Shop","New Arrivals","Deals","Account","Cart"].map(x=><Link key={x} className={styles.mobileLink} href={x==="Account"?(user?"/account":"/login"):x==="Cart"?"/cart":"/products"} onClick={()=>setOpen(false)}>{x}</Link>)}</nav></div>}</header>;
}