import { Activity, ShoppingCart, WalletCards } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function Analytics() {
  const s = await createClient();
  const { data } = await s.from("orders").select("total,status,created_at").order("created_at", { ascending: false }).limit(100);
  const active = (data || []).filter((x) => x.status !== "CANCELLED");
  const revenue = active.reduce((n, x) => n + Number(x.total || 0), 0);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Reports</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Analytics</h1>
      <p className="mt-2 text-sm text-neutral-500">A simple view of recent store performance.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {[["Revenue","GHS " + revenue.toFixed(2),WalletCards],["Recent orders",String(data?.length || 0),ShoppingCart],["Active orders",String(active.length),Activity]].map(([label,value,Icon]) =>
          <div key={String(label)} className="rounded-xl border bg-white p-6"><div className="flex items-center justify-between"><p className="text-sm text-neutral-500">{label}</p><Icon size={18} className="text-neutral-400"/></div><p className="mt-4 text-3xl font-black">{value}</p></div>
        )}
      </div>
      <div className="mt-6 rounded-xl border bg-white p-6"><h2 className="font-bold">Recent order activity</h2><div className="mt-5 space-y-3">{(data || []).slice(0,8).map((x,i)=><div key={i} className="flex items-center justify-between border-b pb-3 text-sm last:border-0"><span className="text-neutral-500">{new Date(x.created_at).toLocaleDateString()}</span><span className="font-semibold">{x.status}</span><span>GHS {Number(x.total).toFixed(2)}</span></div>)}</div></div>
    </section>
  );
}
