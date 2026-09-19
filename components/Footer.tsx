import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 bg-neutral-950 text-white">
      <div className="container py-14">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-2xl font-black tracking-tight">Myshop</Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
              A clean, dependable shopping experience built for modern customers.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-400">
              <Link className="block hover:text-white" href="/products">All products</Link>
              <Link className="block hover:text-white" href="/products">Featured</Link>
              <Link className="block hover:text-white" href="/cart">Cart</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <div className="mt-4 space-y-3 text-sm text-neutral-400">
              <Link className="block hover:text-white" href="/account">My account</Link>
              <Link className="block hover:text-white" href="/login">Sign in</Link>
              <Link className="block hover:text-white" href="/register">Create account</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Support</h3>
            <p className="mt-4 text-sm leading-6 text-neutral-400">
              Need help with an order? Sign in to manage your account and orders.
            </p>
            <Link href="/account" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              Account support <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Myshop. All rights reserved.</p>
          <p>Secure checkout · Customer accounts · GHS pricing</p>
        </div>
      </div>
    </footer>
  );
}
