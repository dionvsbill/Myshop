import { ClipboardList } from "lucide-react";
import { createClient } from "../../../../lib/supabase/server";

export default async function Orders() {
  const s = await createClient();
  const { data, error } = await s.from("orders").select("id,order_number,total,status,created_at,profiles(email,full_name)").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Sales</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Orders</h1>
      <p className="mt-2 text-sm text-neutral-500">Manage fulfilment and customer orders.</p>
      <div className="mt-7 overflow-hidden rounded-xl border bg-white">
        <div className="hidden grid-cols-[1fr_1.3fr_120px_120px_120px] gap-4 border-b bg-neutral-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500 md:grid"><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Date</span></div>
        {(data ?? []).map((o) => {
          const profile = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
          const statusClass = o.status === "CANCELLED" ? "bg-red-50 text-red-700" : o.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-700";
          return <div key={o.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1fr_1.3fr_120px_120px_120px] md:items-center">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100"><ClipboardList size={16}/></div><span className="font-semibold">{o.order_number}</span></div>
            <div><p className="font-medium">{profile?.full_name || "Customer"}</p><p className="text-xs text-neutral-500">{profile?.email || "—"}</p></div>
            <p className="font-semibold">GHS {Number(o.total).toFixed(2)}</p>
            <span className={"w-fit rounded-full px-2.5 py-1 text-xs font-semibold " + statusClass}>{o.status}</span>
            <p className="text-sm text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</p>
          </div>;
        })}
      </div>
    </section>
  );
}
