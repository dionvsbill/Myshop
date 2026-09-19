import Link from "next/link";
import { ArrowUpRight, Package, ShoppingCart, Users, WalletCards } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";

export default async function Admin() {
  const s = await createClient();
  const [{ count: products }, { count: users }, { count: orders }, { data: rev }] = await Promise.all([
    s.from("products").select("id", { count: "exact", head: true }),
    s.from("profiles").select("id", { count: "exact", head: true }),
    s.from("orders").select("id", { count: "exact", head: true }),
    s.from("orders").select("total").neq("status", "CANCELLED"),
  ]);
  const revenue = (rev || []).reduce((n, x) => n + Number(x.total || 0), 0);

  const stats = [
    ["Total sales", "GHS " + revenue.toFixed(2), WalletCards],
    ["Orders", String(orders || 0), ShoppingCart],
    ["Products", String(products || 0), Package],
    ["Customers", String(users || 0), Users],
  ] as const;

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Overview</p><h1 className="mt-2 text-3xl font-black tracking-tight">Good day, administrator</h1><p className="mt-2 text-sm text-neutral-500">Here is what is happening in your store.</p></div>
        <Link href="/admin/products/new" className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">Add product</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label,value,Icon]) => <div key={label} className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between"><span className="text-sm text-neutral-500">{label}</span><Icon size={18} className="text-neutral-400"/></div>
          <p className="mt-4 text-2xl font-black">{value}</p>
        </div>)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Store activity</h2><p className="mt-1 text-sm text-neutral-500">Keep your catalogue and orders moving.</p></div><Link href="/admin/analytics" className="text-sm font-semibold">Analytics <ArrowUpRight className="inline" size={15}/></Link></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[["Products","Manage your catalogue and stock.","/admin/products"],["Orders","Review customer orders and fulfilment.","/admin/orders"],["Customers","View customer accounts.","/admin/users"],["Collections","Organise products into categories.","/admin/categories"]].map(([title,desc,href]) => <Link key={title} href={href} className="rounded-xl border p-4 transition hover:border-neutral-300 hover:bg-neutral-50"><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-neutral-500">{desc}</p></Link>)}
          </div>
        </div>
        <div className="rounded-xl bg-neutral-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Store health</p><h2 className="mt-3 text-xl font-bold">Your storefront is ready to grow.</h2><p className="mt-3 text-sm leading-6 text-neutral-400">Use the catalogue, orders and analytics tools to keep your store organised.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-neutral-950">View storefront</Link></div>
      </div>
    </section>
  );
}
