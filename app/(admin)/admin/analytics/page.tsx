import { Activity, ShoppingCart, WalletCards, Users, Package } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function Analytics() {
  const s = await createClient();
  const [{ data: orders }, { count: users }, { count: products }] = await Promise.all([
    s.from("orders").select("total,status,created_at").order("created_at", { ascending: false }).limit(100),
    s.from("profiles").select("id", { count: "exact", head: true }),
    s.from("products").select("id", { count: "exact", head: true }),
  ]);

  const active = (orders || []).filter((x) => x.status !== "CANCELLED");
  const revenue = active.reduce((n, x) => n + Number(x.total || 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const value = active
      .filter((x) => {
        const t = new Date(x.created_at);
        return t >= d && t < next;
      })
      .reduce((n, x) => n + Number(x.total || 0), 0);
    return { label: d.toLocaleDateString("en", { weekday: "short" }), value };
  });
  const max = Math.max(...days.map((x) => x.value), 1);
  const metrics = [
    ["Revenue", "GHS " + revenue.toFixed(2), WalletCards],
    ["Orders", String(orders?.length || 0), ShoppingCart],
    ["Customers", String(users || 0), Users],
    ["Products", String(products || 0), Package],
  ] as const;

  return (
    <section>
      <p className="eyebrow">Store intelligence</p>
      <h1 className="page-title mt-2">Analytics</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <div className="rounded-lg border bg-white p-5 shadow-sm" key={label}>
            <div className="flex justify-between text-neutral-500"><span className="text-sm">{label}</span><Icon size={18} /></div>
            <p className="mt-3 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="font-bold">Revenue · last 7 days</h2><span className="text-xs text-neutral-400">GHS</span></div>
          <div className="mt-8 flex h-52 items-end gap-3">
            {days.map((d) => (
              <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="rounded-t bg-[#f68b1e] transition" style={{ height: Math.max(4, (d.value / max) * 100) + "%" }} />
                <span className="text-center text-[10px] text-neutral-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="font-bold">Order status</h2>
          <div className="mt-5 space-y-3">
            {["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => {
              const n = (orders || []).filter((x) => x.status === status).length;
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-xs"><span>{status}</span><b>{n}</b></div>
                  <div className="h-2 rounded-full bg-neutral-100"><div className="h-full rounded-full bg-[#f68b1e]" style={{ width: Math.min(100, n * 12) + "%" }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Activity size={18} /><h2 className="font-bold">Recent activity</h2></div>
        <div className="mt-4 divide-y">
          {(orders || []).slice(0, 8).map((x, i) => (
            <div key={i} className="flex justify-between py-3 text-sm"><span className="text-neutral-500">{new Date(x.created_at).toLocaleDateString()}</span><b>{x.status}</b><span>GHS {Number(x.total).toFixed(2)}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}