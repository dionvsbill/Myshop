"use client";

import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { createClient } from "../lib/supabase/client";
import { useEffect, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCart(0);
      return;
    }

    let mounted = true;

    (async () => {
      const { count } = await createClient()
        .from("cart_items")
        .select("id", { count: "exact", head: true });

      if (mounted) setCart(count || 0);
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function signOut() {
    await createClient().auth.signOut();
    location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="border-b border-black/5 bg-neutral-950 text-center text-xs font-medium text-white">
        <div className="container py-2">Free delivery on selected orders</div>
      </div>

      <div className="container flex h-[72px] items-center gap-4">
        <button
          className="rounded-lg p-2 md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="shrink-0 text-2xl font-black tracking-tight">
          Myshop
        </Link>

        <nav className="ml-6 hidden items-center gap-7 text-sm font-medium md:flex">
          <Link className="transition hover:text-neutral-500" href="/products">
            Shop
          </Link>
          <Link className="transition hover:text-neutral-500" href="/products?category=featured">
            Featured
          </Link>
          <Link className="transition hover:text-neutral-500" href="/products">
            New arrivals
          </Link>
        </nav>

        <form action="/products" className="ml-auto hidden w-full max-w-md lg:block">
          <div className="flex items-center rounded-xl border border-black/10 bg-neutral-50 px-3 focus-within:bg-white">
            <Search size={18} className="text-neutral-500" />
            <input
              name="q"
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
              placeholder="Search products"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-4">
          <Link href="/products" className="rounded-lg p-2.5 hover:bg-neutral-100 lg:hidden" aria-label="Search">
            <Search size={20} />
          </Link>
          <button className="hidden rounded-lg p-2.5 hover:bg-neutral-100 sm:block" aria-label="Wishlist">
            <Heart size={20} />
          </button>
          {user ? (
            <Link href="/account" className="rounded-lg p-2.5 hover:bg-neutral-100" aria-label="Account">
              <User size={20} />
            </Link>
          ) : (
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold sm:block">
              Sign in
            </Link>
          )}
          <Link href="/cart" className="relative rounded-lg p-2.5 hover:bg-neutral-100" aria-label="Cart">
            <ShoppingBag size={21} />
            {cart > 0 && (
              <span className="absolute right-0 top-0 min-w-5 rounded-full bg-neutral-950 px-1 text-center text-[10px] font-bold leading-5 text-white">
                {cart}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <nav className="container flex flex-col py-4 text-sm font-medium">
            <Link onClick={() => setMobileOpen(false)} className="border-b py-4" href="/products">Shop</Link>
            <Link onClick={() => setMobileOpen(false)} className="border-b py-4" href="/products">Featured</Link>
            <Link onClick={() => setMobileOpen(false)} className="border-b py-4" href="/products">New arrivals</Link>
            {user ? (
              <button onClick={signOut} className="py-4 text-left text-neutral-500">Sign out</button>
            ) : (
              <Link onClick={() => setMobileOpen(false)} className="py-4" href="/login">Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
